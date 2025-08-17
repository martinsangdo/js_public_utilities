//get max and min values of data
function get_gap_values(){
    var max_value = 0;
    var min_value = Number.MAX_VALUE;
    for (year in BAR_DATA){
        for (key in BAR_DATA[year]){
            max_value = Math.max(max_value, BAR_DATA[year][key]);
            if (BAR_DATA[year][key] != 0){
                min_value = Math.min(min_value, BAR_DATA[year][key])
            }
        }
    }

    return max_value - min_value;   
}
//
function transform_data(labels){
    var list = [];
    for (year in BAR_DATA){
        var year_info = [];
        for (var i=0; i<labels.length; i++){
            year_info.push(BAR_DATA[year][labels[i]]);
        }
        list.push(year_info);
    }
    return list;
}