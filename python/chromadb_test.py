import os
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter

# =====================================================================
# 1. READ: Load the raw file content
# =====================================================================
file_path = "company_policy.txt"

if not os.path.exists(file_path):
    raise FileNotFoundError(f"Please create the '{file_path}' file first!")

with open(file_path, "r", encoding="utf-8") as f:
    raw_document_text = f.read()

print("✅ Step 1: Raw file loaded successfully.")

# =====================================================================
# 2. CHUNK: Split the document into clean, readable fragments
# =====================================================================
# We use a semantic-friendly character splitter.
# It tries to split by paragraphs and sentences first so meaning isn't lost.
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=150,      # Maximum characters per chunk
    chunk_overlap=30     # Overlap text between chunks so sentences aren't cut blindly
)

chunks = text_splitter.split_text(raw_document_text)

print(f"✅ Step 2: Split document into {len(chunks)} smaller chunks.")
for i, chunk in enumerate(chunks):
    print(f"   👉 Chunk {i}: '{chunk.strip()}'")

# =====================================================================
# 3. STORE: Initialize ChromaDB and save the chunks
# =====================================================================
# 'PersistentClient' saves the data to a local folder instead of keeping it in RAM
client = chromadb.PersistentClient(path="./my_local_rag_db")
# Print current collections just to verify we aren't erasing your old work
print("📋 Existing collections in your database:", client.list_collections())

# Create or retrieve the collection. 
# Chroma automatically assigns its default embedding model (all-MiniLM-L6-v2) under the hood.
collection = client.get_or_create_collection(name="internal_policies")

# Generate unique IDs for our chunks
chunk_ids = [f"policy_chunk_{i}" for i in range(len(chunks))]

# Add the chunks to our local database
collection.add(
    documents=chunks,
    ids=chunk_ids
)

print("✅ Step 3: Chunks successfully embedded and stored in 'internal_policies' collection.")
print("ℹ️ Note: A folder named './my_local_rag_db' has been created on your machine.")

# =====================================================================
# 4. VERIFY: Run a semantic search query to prove it works!
# =====================================================================
print("\n🔍 --- Running Validation Search ---")
user_query = "What days do I have to come to the physical office?"

# Query the database
search_results = collection.query(
    query_texts=[user_query],
    n_results=1  # Bring back only the absolute closest match
)

print(f"User Question: '{user_query}'")
print(f"Retrieved Document Match: '{search_results['documents'][0][0]}'")
print(f"Mathematical Similarity Distance Score: {search_results['distances'][0][0]:.4f}")