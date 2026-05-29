import os
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
import shutil
# =====================================================================
# PHASE 1: Establish Persistent Connection (Preserves All Collections)
# =====================================================================
db_path = "./my_local_rag_db"

if os.path.exists(db_path):
    # Shutil handles deleting the entire folder structure cleanly
    # shutil.rmtree(db_path)  # WARNING: This will delete all existing collections and data in that folder!
    print("🧹 Database folder deleted from disk.")

# Initialize client pointing to your existing local database directory
client = chromadb.PersistentClient(path=db_path)

# Print current collections just to verify we aren't erasing your old work
print("📋 Existing collections in your database:", client.list_collections())

# Get or create our targeted collection
collection_name = "company_policies_v2"
collection = client.get_or_create_collection(name=collection_name)

# =====================================================================
# PHASE 2: Read the Text File Safely
# =====================================================================
file_path = "company_policy.txt"

with open(file_path, "r", encoding="utf-8") as f:
    raw_document_text = f.read()

print(f"📖 Successfully loaded text from '{file_path}'.")

# =====================================================================
# PHASE 3: Generate Parent Context Windows
# =====================================================================
# This fallback splitter slices text smoothly even if the file lacks newlines
parent_splitter = RecursiveCharacterTextSplitter(
    chunk_size=170,       
    chunk_overlap=30,     
    separators=["\n\n", "\n", ". ", " ", ""] 
)
parent_sections = parent_splitter.split_text(raw_document_text)
for i, section in enumerate(parent_sections):
    print(f"   👉 Parent Section {i}: '{section.strip()}'")
print(f"🧩 Created {len(parent_sections)} overlapping Parent context windows.")

# =====================================================================
# PHASE 4: Granular Child Slicing & Database Upsert
# =====================================================================
child_splitter = RecursiveCharacterTextSplitter(
    chunk_size=80,        
    chunk_overlap=15,     
    separators=[" ", ""]  
)

print("🚀 Executing Parent-Child database mapping via UPSERT...")

# Track total fragments for logging
total_child_chunks = 0

for parent_idx, parent_text in enumerate(parent_sections):
    parent_text = parent_text.strip()
    if not parent_text:
        continue
        
    # Split this specific parent block into narrow semantic search items
    child_fragments = child_splitter.split_text(parent_text)
    
    documents = []
    metadatas = []
    ids = []
    
    for child_idx, fragment in enumerate(child_fragments):
        print(f"   🔹 Parent {parent_idx} -> Child {child_idx}: '{fragment.strip()}'")
        documents.append(fragment)
        # Unique composite ID strategy: prevents overlapping document conflicts
        ids.append(f"policy_p{parent_idx}_c{child_idx}")
        # Map the heavy parent context string right inside the metadata dictionary
        metadatas.append({
            "parent_context": parent_text,
            "fragment_snippet": fragment
        })
        total_child_chunks += 1
        
    # Using .upsert() instead of .add() keeps this script idempotent and safe
    collection.upsert(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )

print(f"✅ Ingestion complete. Synced {total_child_chunks} child search paths.")

# =====================================================================
# PHASE 5: Verified Query Retrieval Execution
# =====================================================================
print("\n🔍 --- Running Verification Context Retrieval Search ---")
user_query = "What days do I have to come to the physical office?"

# Query the child index, explicitly forcing metadata retrieval
search_results = collection.query(
    query_texts=[user_query],
    n_results=1,
    include=["documents", "metadatas", "distances"]
)

# Extract and display the values safely
if search_results['metadatas'] and search_results['metadatas'][0]:
    matched_child_fragment = search_results['documents'][0][0]
    retrieved_parent_context = search_results['metadatas'][0][0]['parent_context']
    distance_score = search_results['distances'][0][0]
    
    print(f"User Query: '{user_query}'\n")
    print(f"🎯 Closest Match (Child Fragment Vector): '{matched_child_fragment}'")
    print(f"📉 Match Distance Score: {distance_score:.4f}\n")
    print(f"📚 Full Parent Context Window Extracted for the LLM:")
    print("-" * 70)
    print(retrieved_parent_context)
    print("-" * 70)
    print("\n💎 Success: System retrieved the complete paragraph context safely!")
else:
    print("❌ Critical Error: Matching vector found but metadata retrieval failed.")