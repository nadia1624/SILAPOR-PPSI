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

    var data = {"OkPercent": 89.5638779243285, "KoPercent": 10.436122075671513};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [6.257822277847309E-4, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "Admin Reports"], "isController": false}, {"data": [0.0, 500, 1500, "Admin Reports-0"], "isController": false}, {"data": [0.0, 500, 1500, "Mahasiswa Home-1"], "isController": false}, {"data": [0.0, 500, 1500, "Mahasiswa Home-0"], "isController": false}, {"data": [0.0, 500, 1500, "Admin Reports-1"], "isController": false}, {"data": [0.0, 500, 1500, "My Reports"], "isController": false}, {"data": [0.0, 500, 1500, "Report Form Page"], "isController": false}, {"data": [0.0, 500, 1500, "Admin Claims"], "isController": false}, {"data": [0.0, 500, 1500, "Mahasiswa Home"], "isController": false}, {"data": [0.0, 500, 1500, "My Claims-0"], "isController": false}, {"data": [0.0, 500, 1500, "Profile Page"], "isController": false}, {"data": [0.0, 500, 1500, "My Claims-1"], "isController": false}, {"data": [0.0, 500, 1500, "Login Mahasiswa"], "isController": false}, {"data": [0.0, 500, 1500, "Login Admin"], "isController": false}, {"data": [0.0, 500, 1500, "My Claims"], "isController": false}, {"data": [0.0, 500, 1500, "Login Mahasiswa-0"], "isController": false}, {"data": [0.0, 500, 1500, "My Reports-0"], "isController": false}, {"data": [0.001530612244897959, 500, 1500, "Login Mahasiswa-1"], "isController": false}, {"data": [0.0, 500, 1500, "My Reports-1"], "isController": false}, {"data": [0.00510204081632653, 500, 1500, "Login Mahasiswa-2"], "isController": false}, {"data": [0.0, 500, 1500, "Admin Home"], "isController": false}, {"data": [0.0, 500, 1500, "Admin Users"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 10387, 1084, 10.436122075671513, 13978.466352170977, 701, 55912, 10859.0, 30248.600000000006, 38391.600000000006, 51603.240000000005, 52.89612254667305, 519.2547762771432, 17.4290292107595], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Admin Reports", 27, 0, 0.0, 20133.7037037037, 6567, 41088, 19467.0, 36502.6, 40670.799999999996, 41088.0, 0.14464957301589004, 2.5441488829168857, 0.06257789145121023], "isController": false}, {"data": ["Admin Reports-0", 27, 0, 0.0, 10672.22222222222, 2847, 25069, 8991.0, 21910.399999999998, 24967.8, 25069.0, 0.1465798045602606, 0.12583447848805646, 0.032636909609120524], "isController": false}, {"data": ["Mahasiswa Home-1", 685, 1, 0.145985401459854, 9318.762043795618, 2015, 26033, 8513.0, 20576.2, 22156.799999999996, 24257.62, 3.7062687342415948, 61.93733869615089, 0.7962686733722176], "isController": false}, {"data": ["Mahasiswa Home-0", 685, 0, 0.0, 10716.148905109485, 2025, 26080, 9900.0, 21671.6, 24067.3, 24957.34, 3.6757800971264523, 3.1742329408253065, 0.839973186257412], "isController": false}, {"data": ["Admin Reports-1", 27, 0, 0.0, 9461.185185185186, 2458, 25628, 7836.0, 18053.6, 22920.799999999985, 25628.0, 0.1490584474734593, 2.4937314367026064, 0.031296451373822025], "isController": false}, {"data": ["My Reports", 570, 0, 0.0, 16148.084210526325, 4425, 41454, 12458.0, 31305.999999999993, 35523.999999999985, 40106.999999999985, 3.2054165916861614, 56.40869799633345, 1.439933234546518], "isController": false}, {"data": ["Report Form Page", 491, 491, 100.0, 8478.27087576375, 2068, 24473, 8431.0, 14169.6, 14907.8, 16669.399999999998, 4.036567520018415, 6.473766871269668, 0.950012472973084], "isController": false}, {"data": ["Admin Claims", 21, 21, 100.0, 13341.57142857143, 4472, 24880, 11648.0, 22077.600000000002, 24622.199999999997, 24880.0, 0.12697568113383237, 0.20294025227346935, 0.028147929313847606], "isController": false}, {"data": ["Mahasiswa Home", 685, 1, 0.145985401459854, 20035.175182481755, 4437, 41709, 20151.0, 35560.6, 37695.1, 40629.78, 3.635263649486287, 63.88998149033869, 1.6117282195964593], "isController": false}, {"data": ["My Claims-0", 513, 0, 0.0, 7449.970760233915, 2027, 25197, 6346.0, 14425.0, 21033.0, 24485.64, 3.255571914504747, 2.810635324383155, 0.756666128566533], "isController": false}, {"data": ["Profile Page", 490, 490, 100.0, 10704.94081632653, 2032, 20544, 10911.0, 15964.000000000002, 16502.749999999996, 17183.09, 5.600192006583082, 8.983299070253837, 1.2961381890236237], "isController": false}, {"data": ["My Claims-1", 513, 0, 0.0, 7103.378167641322, 2055, 24880, 7354.0, 9719.6, 11208.699999999999, 22387.780000000002, 3.5213442886266755, 58.92819968055642, 0.7565388120096374], "isController": false}, {"data": ["Login Mahasiswa", 980, 0, 0.0, 37135.11224489797, 5555, 55912, 37957.5, 51637.7, 52538.1, 54691.9, 4.990706083059608, 93.2521378793955, 3.986716382756601], "isController": false}, {"data": ["Login Admin", 30, 30, 100.0, 8944.8, 2602, 20792, 8115.5, 17281.100000000002, 19056.749999999996, 20792.0, 0.18621280399240253, 3.1617261112249078, 0.06437434825518602], "isController": false}, {"data": ["My Claims", 513, 0, 0.0, 14553.499025341142, 4481, 42705, 13296.0, 20499.600000000002, 30466.6, 39615.34000000001, 3.206971568602936, 56.43598300828624, 1.4343681429884223], "isController": false}, {"data": ["Login Mahasiswa-0", 980, 0, 0.0, 13579.759183673472, 1927, 25884, 13894.5, 22605.0, 24221.6, 25163.95, 5.088873541492494, 5.529215870469994, 1.80893551670241], "isController": false}, {"data": ["My Reports-0", 570, 0, 0.0, 9042.200000000008, 2132, 25248, 8054.5, 21021.4, 23812.3, 24658.45, 3.242948010422949, 2.8009596654785343, 0.7600659399428786], "isController": false}, {"data": ["Login Mahasiswa-1", 980, 0, 0.0, 13177.8081632653, 1041, 26109, 13465.0, 21863.399999999998, 23758.5, 25474.749999999993, 5.0901158261050234, 4.396042783916792, 1.1631709993247805], "isController": false}, {"data": ["My Reports-1", 570, 0, 0.0, 7105.647368421055, 2051, 25358, 5256.5, 15372.099999999999, 20644.399999999994, 24261.87, 3.3476440221061967, 56.020219980956604, 0.7192203953743782], "isController": false}, {"data": ["Login Mahasiswa-2", 980, 0, 0.0, 10377.323469387746, 701, 26050, 9698.0, 21206.8, 22412.799999999985, 25170.66, 5.0812481204566895, 85.03461539520963, 1.0916744008793668], "isController": false}, {"data": ["Admin Home", 30, 30, 100.0, 9819.866666666669, 2273, 25057, 7970.5, 20625.100000000002, 22737.1, 25057.0, 0.1634360801490537, 0.26152964934789, 0.03591124807962606], "isController": false}, {"data": ["Admin Users", 20, 20, 100.0, 14132.349999999999, 5090, 23739, 12791.5, 22534.700000000004, 23686.1, 23739.0, 0.18071091674648065, 0.28881098711079384, 0.039883464047563114], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["500/Internal Server Error", 2, 0.18450184501845018, 0.01925483777799172], "isController": false}, {"data": ["401/Unauthorized", 30, 2.7675276752767526, 0.2888225666698758], "isController": false}, {"data": ["404/Not Found", 1052, 97.0479704797048, 10.128044671223645], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 10387, 1084, "404/Not Found", 1052, "401/Unauthorized", 30, "500/Internal Server Error", 2, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Mahasiswa Home-1", 685, 1, "500/Internal Server Error", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Report Form Page", 491, 491, "404/Not Found", 491, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Admin Claims", 21, 21, "404/Not Found", 21, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Mahasiswa Home", 685, 1, "500/Internal Server Error", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["Profile Page", 490, 490, "404/Not Found", 490, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Login Admin", 30, 30, "401/Unauthorized", 30, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Admin Home", 30, 30, "404/Not Found", 30, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Admin Users", 20, 20, "404/Not Found", 20, "", "", "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
