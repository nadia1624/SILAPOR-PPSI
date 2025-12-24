/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 87.46723129663239, "KoPercent": 12.532768703367614};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.015527324057269611, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "Admin Reports"], "isController": false}, {"data": [0.0, 500, 1500, "Admin Reports-0"], "isController": false}, {"data": [0.06605222734254992, 500, 1500, "Mahasiswa Home-1"], "isController": false}, {"data": [0.018433179723502304, 500, 1500, "Mahasiswa Home-0"], "isController": false}, {"data": [0.0, 500, 1500, "Admin Reports-1"], "isController": false}, {"data": [0.0, 500, 1500, "My Reports"], "isController": false}, {"data": [0.0, 500, 1500, "Report Form Page"], "isController": false}, {"data": [0.0, 500, 1500, "Admin Claims"], "isController": false}, {"data": [0.0, 500, 1500, "Mahasiswa Home"], "isController": false}, {"data": [0.032586558044806514, 500, 1500, "My Claims-0"], "isController": false}, {"data": [0.0, 500, 1500, "Profile Page"], "isController": false}, {"data": [0.032586558044806514, 500, 1500, "My Claims-1"], "isController": false}, {"data": [0.0, 500, 1500, "Login Mahasiswa"], "isController": false}, {"data": [0.0, 500, 1500, "Login Admin"], "isController": false}, {"data": [0.0, 500, 1500, "My Claims"], "isController": false}, {"data": [0.0, 500, 1500, "Login Mahasiswa-0"], "isController": false}, {"data": [0.03667953667953668, 500, 1500, "My Reports-0"], "isController": false}, {"data": [0.0, 500, 1500, "Login Mahasiswa-1"], "isController": false}, {"data": [0.07432432432432433, 500, 1500, "My Reports-1"], "isController": false}, {"data": [0.01031487513572204, 500, 1500, "Login Mahasiswa-2"], "isController": false}, {"data": [0.0, 500, 1500, "Admin Home"], "isController": false}, {"data": [0.0, 500, 1500, "Admin Users"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 9918, 1243, 12.532768703367614, 13941.358540028223, 403, 63353, 9593.5, 32963.700000000004, 46933.0, 60019.49999999997, 51.81412115038007, 497.75174053267773, 16.81327220959695], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Admin Reports", 20, 0, 0.0, 22597.049999999996, 7181, 42667, 21899.0, 41926.700000000004, 42645.5, 42667.0, 0.18861874493087125, 3.3175532140634134, 0.08159971094177339], "isController": false}, {"data": ["Admin Reports-0", 20, 0, 0.0, 9272.700000000003, 1952, 17781, 8581.0, 17228.300000000003, 17758.0, 17781.0, 0.21198342289632952, 0.18180062694097324, 0.04719943400426087], "isController": false}, {"data": ["Mahasiswa Home-1", 651, 5, 0.7680491551459293, 7076.887864823351, 828, 30596, 2538.0, 20440.4, 25590.999999999993, 28465.400000000005, 3.7478626819958665, 62.34300135399455, 0.7990205038601258], "isController": false}, {"data": ["Mahasiswa Home-0", 651, 0, 0.0, 10788.064516129036, 1287, 30381, 9777.0, 25720.40000000001, 26933.6, 28945.36, 3.6314547574288634, 3.1363450275984985, 0.82984415355308], "isController": false}, {"data": ["Admin Reports-1", 20, 0, 0.0, 13323.599999999999, 4065, 25345, 13317.0, 24283.400000000005, 25300.5, 25345.0, 0.21003770176746728, 3.51415227470831, 0.04409971277344283], "isController": false}, {"data": ["My Reports", 530, 14, 2.641509433962264, 8928.073584905667, 3099, 47585, 4279.0, 30460.500000000004, 38680.24999999999, 46911.299999999996, 3.2842350520830106, 56.56072184620485, 1.4392734094697508], "isController": false}, {"data": ["Report Form Page", 490, 490, 100.0, 7605.838775510206, 1420, 21674, 6795.5, 11834.300000000001, 13934.899999999998, 16497.07, 8.315232147705675, 13.335228743127207, 1.9570028785127613], "isController": false}, {"data": ["Admin Claims", 20, 20, 100.0, 16533.25, 9990, 27724, 14248.0, 26856.900000000005, 27690.55, 27724.0, 0.20969416106608513, 0.3352751613334452, 0.046484936095704414], "isController": false}, {"data": ["Mahasiswa Home", 670, 24, 3.582089552238806, 18226.380597014926, 2828, 47844, 13799.5, 40952.899999999994, 45136.6, 47451.53, 3.69160243094775, 63.09671077190305, 1.584373691409586], "isController": false}, {"data": ["My Claims-0", 491, 0, 0.0, 3493.12627291242, 1281, 22363, 3058.0, 5261.6, 5515.0, 16495.04, 4.116848053929871, 3.554464456026864, 0.9568455437844817], "isController": false}, {"data": ["Profile Page", 490, 490, 100.0, 11917.414285714282, 1425, 30173, 11367.0, 19287.300000000003, 22685.099999999955, 30088.829999999998, 5.588886100782444, 9.126527587283572, 1.2697629321406574], "isController": false}, {"data": ["My Claims-1", 491, 0, 0.0, 4501.242362525461, 852, 16721, 3524.0, 10082.6, 11415.4, 12196.56, 4.877418842134541, 81.62246699857452, 1.0478829543648427], "isController": false}, {"data": ["Login Mahasiswa", 976, 80, 8.19672131147541, 44586.00922131145, 7920, 63353, 46568.5, 60051.9, 61337.3, 62088.0, 5.098868949664342, 89.23826747511951, 3.8433855268657107], "isController": false}, {"data": ["Login Admin", 30, 30, 100.0, 10740.033333333333, 1976, 30443, 7077.5, 27599.9, 28971.75, 30443.0, 0.16222266683249428, 2.679647028824264, 0.05421152010749955], "isController": false}, {"data": ["My Claims", 491, 0, 0.0, 7994.857433808554, 3122, 28519, 7102.0, 14414.4, 15898.4, 24251.239999999998, 3.9908316535535473, 70.2312997075964, 1.7849618137964107], "isController": false}, {"data": ["Login Mahasiswa-0", 936, 0, 0.0, 16366.93482905983, 1718, 29975, 16374.5, 27149.7, 28157.55, 29848.14, 4.9844502194010145, 5.417258201244516, 1.7718162889277043], "isController": false}, {"data": ["My Reports-0", 518, 0, 0.0, 4920.513513513513, 1293, 29932, 2303.5, 17869.600000000002, 23372.25, 28281.989999999994, 3.2478321660783367, 2.8041416228031673, 0.7612106639246101], "isController": false}, {"data": ["Login Mahasiswa-1", 936, 15, 1.6025641025641026, 16538.013888888894, 1600, 30532, 16323.5, 27148.3, 28765.3, 30169.0, 4.9856184084372, 4.5315069627543405, 1.1210338267018216], "isController": false}, {"data": ["My Reports-1", 518, 2, 0.3861003861003861, 3507.1486486486497, 829, 30549, 2213.5, 5125.6, 16664.25, 27610.999999999985, 3.547945205479452, 59.19304500214041, 0.7593107876712328], "isController": false}, {"data": ["Login Mahasiswa-2", 921, 25, 2.7144408251900107, 12497.879478827352, 403, 31525, 11662.0, 26801.8, 28178.3, 30530.0, 4.930829193078637, 80.76846952897465, 1.0306021929073155], "isController": false}, {"data": ["Admin Home", 28, 28, 100.0, 9779.25, 1534, 30177, 9106.5, 30168.1, 30173.4, 30177.0, 0.15473374743031454, 0.27366049101715334, 0.030356352165719844], "isController": false}, {"data": ["Admin Users", 20, 20, 100.0, 12902.349999999999, 2604, 30355, 11341.5, 25666.2, 30125.999999999996, 30355.0, 0.18981274972239887, 0.3186129344339309, 0.03979765367714749], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["401/Unauthorized", 29, 2.333065164923572, 0.29239766081871343], "isController": false}, {"data": ["404/Not Found", 1035, 83.266291230893, 10.43557168784029], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 179, 14.400643604183427, 1.8047993547086105], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 9918, 1243, "404/Not Found", 1035, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 179, "401/Unauthorized", 29, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Mahasiswa Home-1", 651, 5, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 5, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["My Reports", 530, 14, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 14, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Report Form Page", 490, 490, "404/Not Found", 490, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Admin Claims", 20, 20, "404/Not Found", 20, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Mahasiswa Home", 670, 24, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 24, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["Profile Page", 490, 490, "404/Not Found", 481, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 9, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["Login Mahasiswa", 976, 80, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 80, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Login Admin", 30, 30, "401/Unauthorized", 29, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 1, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Login Mahasiswa-1", 936, 15, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 15, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["My Reports-1", 518, 2, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 2, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Login Mahasiswa-2", 921, 25, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 25, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Admin Home", 28, 28, "404/Not Found", 25, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 3, "", "", "", "", "", ""], "isController": false}, {"data": ["Admin Users", 20, 20, "404/Not Found", 19, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 1, "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
