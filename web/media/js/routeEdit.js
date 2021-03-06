var COMPANYADDR = new BMap.Point(121.438328, 31.023632);
var routes = [];
var UNSAVEDCOLOR = "#333333";
//var COLOR = ["#537082", "#FF9900", "#548C00", "##009933", "#CC0066", "#009999", "#666699", "#FF6600", "#8F4586"];
var COLOR = ["#ed423e", "#19f819", "#136de7", "#f5e20c", "#CC0066", "#009999", "#4c4c93", "#FF6600", "#06a8aa"];

var startId = 0;
var newRouteIndex = 0;
var gridster = null;
var reloadMap = document.getElementById("reloadMap");
//station marker数组
var stationMarkerArr = [];
reloadMap.onclick = function () {
    $.gritter.add({
        title: '正在加载',
        text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;请稍等，正在加载地图...',
        class_name: 'gritter-light',
        sticky: false,
        time: ''
    });
    reload();
};
var resetStations = document.getElementById("resetStations");
var setting_ok = document.getElementById("portlet-setting-ok");
var handleMask = function () {
    $("#mask_max").inputmask({"mask": "9", "repeat": 5, "greedy": false});
    $("#mask_r").inputmask({"mask": "9.9"});
    $("#mask_p").inputmask({"mask": "9", "repeat": 2, "greedy": false});
};
document.getElementById("route-setting-ok").onclick = function () {
    routePlanning(0);
    $("#route-setting").modal('hide');
}
resetStations.onclick = function () {
    $("#portlet-setting").modal('show');
    $("#waitBar").css('width', '0%');
    setting_ok.onclick = function () {
        routes = [];
        newRouteIndex = 0;
        stationCount = 1;
        map.clearOverlays();
        stationArr = [];
        var temp = {};
        temp.time = document.getElementById("selectroutetime").value;
        temp.max = $("#setting_max").val();
        temp.r = $("#setting_r").val();
        temp.population = $("#setting_p").val();
        console.log(temp);
        var da = JSON.stringify(temp);
        $.ajax({
            url: ip + "/RoutePlanning/getnewStationByTime",
            //url:"http://127.0.0.1:3000/RoutePlanning/getnewStationByTime",
            type: 'post',
            data: da,
            contentType: "application/json",
            dataType: "json",
            async: false,
            success: function (data) {
                $("#waitBar").css('width', '20%');
                var num = data.length;
                console.log(data.length);
                //stationArr。push&addmarker
                for (var i = 0; i < num; i++) {
                    var sum = 0;
                    getNearstValid(data[i], function (res, res2) {
                        console.log("finsish");
                        console.log(res);
                        var pos = res.lng + "|" + res.lat;
                        var marker = [{
                            title: "新生成站点_" + stationCount,
                            content: "",
                            point: pos,
                            isOpen: 0,
                            icon: {w: (map.getZoom() - 8) * 5, h: (map.getZoom() - 8) * 5, l: 0, t: 0, x: 6, lb: 5},
                            id: -stationCount,
                            type: 1
                        }];
                        var point = {
                            id: -stationCount,
                            pos: new BMap.Point(res.lng, res.lat),
                            name: "新生成站点_" + stationCount,
                            address: "",
                            num: '0',
                            time: res2.time
                        };//??num

                        //console.log("finish"+i+"__1");

                        var p = new BMap.Point(res.lng, res.lat);
                        getAddByPos(p, point, marker, function (point, marker, s) {
                            point.address = s;
                            marker[0].content = s;
                            stationArr.push(point);
                            stationCount++;
                            addMarker(marker);
                        });
                        sum++;
                        var temRate = parseInt((sum) / num * 80) + 20;
                        console.log(sum);
                        $("#waitBar").css('width', temRate + '%');
                        if (sum == num)    $("#portlet-setting").modal('hide');
                    });
                }
            },
            error: function () {
                alert("重置失败");
            }
        });
    };
};
function getNearstValid(data, cb) {
    var ptA = new BMap.Point(data.posx, data.posy);
    var temP = null;
    var driving = new BMap.DrivingRoute(map, {renderOptions: {map: null}, policy: BMAP_DRIVING_POLICY_LEAST_TIME});
    var point_t = new BMap.Point(121.404, 31.915);
    driving.setSearchCompleteCallback(function (results) {
        temP = results.getPlan(0).getRoute(0).vr[0];
        cb(temP, data);
    });
    driving.search(ptA, point_t);
}

var selectroutetime = document.getElementById("selectroutetime");
selectroutetime.onchange = function () {
    reload();
};
handleMask();
initMap();//创建和初始化地图
setEvent();
getData();
loadData(routes);

map.addEventListener('zoomend', function (type, target) {
    var overlays = map.getOverlays();
    var zoom = map.getZoom();
    if (zoom < 11) map.setZoom(11);
    if (zoom > 16) map.setZoom(16);
    for (var i = 0; i < overlays.length; i++) {
        if (overlays[i].type == 1) {
            var icon = createIcon({w: (zoom - 8) * 5, h: (zoom - 8) * 5, l: 0, t: 0, x: 6, lb: 5}, 1);
            overlays[i].setIcon(icon);
        }
    }
    console.log(map.getZoom());
});

function setEvent() {
    map.addEventListener("click", function (e) {
        var pos = e.point.lng + "|" + e.point.lat;
        if (ifAddMarker == true) {//添加站点
            var marker = [{
                title: "站点_" + stationCount,
                content: "",
                point: pos,
                isOpen: 0,
                icon: {w: (map.getZoom() - 8) * 5, h: (map.getZoom() - 8) * 5, l: 0, t: 0, x: 6, lb: 5},
                id: -stationCount,
                type: 1,
                num: 0
            }];
            var p = new BMap.Point(e.point.lng, e.point.lat);
            var address = $("#getAddByPointResult").val();
            var point = {
                id: -stationCount,
                pos: p,
                name: "站点_" + stationCount,
                address: address,
                num: 0,
                time: document.getElementById("selectroutetime").value
            };
            getAddByPos(p, point, marker, function (point, marker, s) {
                point.address = s;
                stationArr.push(point);
                marker[0].content = s;
                addMarker(marker);
            });
            stationCount++;
            var len = gridster.get_widgets_at_col("1").len + 1;
            var html = "<li id='" + point.id + "'data-row='" + len + "' data-col='" + 1 + "' data-sizex='1' data-sizey='1' style='background:" + UNSAVEDCOLOR + " '> " + "<span style='display: none' class='id'>" + point.id + "</span>" + point.name + "</li>";
            gridster.add_widget(html, 1, 1, 1, len);
        }
    });
}
//站点删除按钮
function deleteStation(stationId) {
    $("#portlet-remove").modal('show');

    ok_1.onclick = function () {
        var index = indexOf(stationId, stationMarkerArr);
        var currMarker = stationMarkerArr[index];
        map.removeOverlay(currMarker);
        $("#portlet-remove").modal('hide');
        if (index != -1) {
            gridster.remove_widget($('#' + stationId));
            stationArr.splice(index, 1);
            changeHints();
        }
    };
}
//站点编辑按钮
function editStation(stationId) {
    var index = indexOf(stationId, stationMarkerArr);
    var stationIndex = indexOf(stationId, stationArr);
    if (stationIndex == -1 || index == -1) {
        alert("没有当前站点或者marker");
        return;
    }
    var currMarker = stationMarkerArr[index];
    var currStation = stationArr[stationIndex];

    var label = currMarker.getLabel();
    txt_title.value = currStation.name;
    txt_content.value = currStation.address;
    $("#portlet-update").modal('show');
    ok_2.onclick = function () {

        $("#portlet-update").modal('hide');
        if (currMarker.type == 1) {
            stationArr[stationIndex].name = txt_title.value;
            stationArr[stationIndex].address = txt_content.value;

            currStation.name = txt_title.value;
            label.setContent(txt_title.value);
            //重新设置显示的label
            currMarker.setLabel(label);
            stationMarkerArr[index] = currMarker;
            //重新设置打开的info窗口
            var pos = currStation.pos.lat + "|" + currStation.pos.lng;
            var newJson = {
                title: currStation.name,
                content: currStation.address,
                point: pos,
                isOpen: 0,
                icon: {w: 15, h: 20, l: 0, t: 0, x: 6, lb: 5},
                id: currStation.id,
                type: 1,
                num: currStation.num
            };
            var _iw = createInfoWindow(newJson);
            currMarker.openInfoWindow(_iw);
            changeHints();
            //修改推动块所显示的站点名称
            console.log($('#' + stationArr[stationIndex].id));
            $('#' + stationArr[stationIndex].id)[0].innerHTML = "<span style='display: none' class='id'>" + stationArr[stationIndex].id + "</span>" + stationArr[stationIndex].name;
        }
    };
}

function MarkerRightClickHandler(marker, iw) {
    var label = marker.getLabel();
    var removeMarker = function (e, ee, marker) {//右键删除站点
        $("#portlet-remove").modal('show');
        ok_1.onclick = function () {
            map.removeOverlay(marker);
            $("#portlet-remove").modal('hide');

            var index = indexOf(marker, stationArr);
            if (index != -1) {
                gridster.remove_widget($('#' + stationArr[index].id));
                stationArr.splice(index, 1);
                changeHints();
            }
        };
    };
    var updateMarker = function () {//右键更新站名
        txt_title.value = label.getContent();
        txt_content.value = iw.getContent();
        $("#portlet-update").modal('show');
        ok_2.onclick = function () {
            label.setContent(txt_title.value);
            iw.setContent(txt_content.value);
            iw.setTitle(txt_title.value);
            iw.redraw();
            $("#portlet-update").modal('hide');
            if (marker.type == 1) {
                var index = indexOf(marker, stationArr);
                if (index != -1) {
                    stationArr[index].name = txt_title.value;
                    stationArr[index].address = txt_content.value;
                    changeHints();
                    console.log($('#' + stationArr[index].id));
                    $('#' + stationArr[index].id)[0].innerHTML = "<span style='display: none' class='id'>" + stationArr[index].id + "</span>" + stationArr[index].name;
                }
            }
        };
    };
    var markerMenu = new BMap.ContextMenu();
    markerMenu.addItem(new BMap.MenuItem('删除站点', removeMarker.bind(marker)));
    markerMenu.addItem(new BMap.MenuItem('修改站点信息', updateMarker.bind(marker)));
    marker.addContextMenu(markerMenu);//给标记添加右键菜单
}

function getData() {
    console.log(1);
    var temp = {};
    temp.time = document.getElementById("selectroutetime").value;
    console.log(temp);
    var da = JSON.stringify(temp);
    $.ajax({
        url: ip + '/users/getRouteByTime',
        type: 'POST',
        data: da,
        contentType: "application/json",
        dataType: 'json',
        async: false,
        success: function (data) {
            routes = data.routes;
            startId = data.next_id;
            newRouteIndex = routes.length;
            console.log(2);
        },
        error: function () {
            alert("链接失败");
        }
    });
}
function loadData(routs) {
    refreshMap(true);
    blocks.innerHTML = "";
    for (var i = 0; i < routs.length; i++) {
        for (var j = 0; j < routs[i].stations.length; j++) {
            var row = j + 1;
            var col = i + 2;
            blocks.innerHTML += "<li id='" + routs[i].stations[j].id + "'data-row='" + row + "' data-col='" + col + "' data-sizex='1' data-sizey='1' style='background:" + COLOR[routs[i].route.id % COLOR.length] + " '> " + "<span style='display: none' class='id'>" + routs[i].stations[j].id + "</span>" + routs[i].stations[j].name + "</li>";
        }
    }
    render();
}
function render() {
    var start_col = null;
    var start_row = null;
    $(function () {
        gridster = $(".gridster > ul").gridster({
            widget_margins: [15, 10],
            widget_base_dimensions: [75, 25],
            extra_cols: 50,
            min_cols: 6,
            draggable: {
                start: function (event, ui) {
                    start_col = $(event.target).attr('data-col');
                    start_row = $(event.target).attr('data-row');
                },
                stop: function (event, ui) {
                    var data_row = $(event.target).attr('data-row');
                    var data_col = $(event.target).attr('data-col');
                    if (data_col == start_col && data_row == start_row) {
                        console.log("not changed");
                        return;
                    }
                    if (parseInt(start_col) > 1) {//擦除并绘制原路线
                        var col = parseInt(start_col) - 2;
                        var routeId = 0;
                        if (col < newRouteIndex) {
                            routeId = routes[col].route.id;
                        } else {
                            routeId = startId + col - newRouteIndex;
                        }
                        var points = [];
                        points.push(COMPANYADDR);
                        gridster.get_widgets_at_col(start_col).wigets.each(function () {
                            //找到各个站点id，points.push()
                            var id = parseInt($(this).attr('id'));
                            var index = indexOf(id, stationArr);
                            if (index > -1) {
                                points.push(stationArr[index].pos);
                            }
                        });
                        console.log("原路线：");
                        console.log(points);
                        cleanRoute(routeId);
                        if (points.length > 1) {
                            createRoute(points, routeId);
                        }
                    }
                    if (parseInt(data_col) > 1 && data_col != start_col) {//擦除并绘制目标路线
                        var col = parseInt(data_col) - 2;
                        var routeId = 0;
                        if (col < newRouteIndex) {
                            routeId = routes[col].route.id;
                        } else {
                            routeId = startId + col - newRouteIndex;
                        }
                        var points = [];
                        points.push(COMPANYADDR);
                        gridster.get_widgets_at_col(start_col).wigets.each(function () {
                            //找到各个站点id，points.push()
                            var id = parseInt($(this).attr('id'));
                            var index = indexOf(id, stationArr);
                            if (index > -1) {
                                points.push(stationArr[index].pos);
                            }
                        });
                        console.log("新路线：");
                        console.log(points);
                        cleanRoute(routeId);
                        if (points.length > 1) {
                            createRoute(points, routeId);
                        }
                    }
                    start_col = null;
                    start_row = null;
                }
            }
        }).data('gridster');
    });
}
function saveRoute() {
    var newRoutes = routes;
    var newId = startId;

    for (var i = 0; i < newRouteIndex; i++) {
        newRoutes[i].stations.length = 0;
    }
    for (var i = newRouteIndex; i < gridster.cols; i++) {
        newRoutes[i] = {route: null, stations: []};
    }

    var col = 1;
    $("#blocks li").each(function () {
        var data_row = $(this).attr('data-row') - 1;
        var data_col = $(this).attr('data-col') - 2;
        if (data_col >= 0) {
            var currentId = $(this).children('span').text();
            var index = indexOf(parseInt(currentId), stationArr);
            if (index > -1) {
                var station = {
                    id: stationArr[index].id,
                    posx: stationArr[index].pos.lng,
                    posy: stationArr[index].pos.lat,
                    name: stationArr[index].name,
                    address: stationArr[index].address,
                    num: stationArr[index].num,
                    time: stationArr[index].time
                };
                newRoutes[data_col].stations[data_row] = station;
            }
        }
    });
    console.log(newRoutes);
    var postDatas = new Array();
    for (var i = 0; i < newRoutes.length; i++) {
        var currentStations = newRoutes[i].stations;
        if (currentStations.length == 0) {
            continue;
        }
        var routeId = 0;
        if (i < newRouteIndex) {
            routeId = newRoutes[i].route.id;
        } else {
            routeId = newId;
            newId++;
        }
        for (var j = 0; j < currentStations.length; j++) {
            var data = {"station": currentStations[j], "route_id": routeId, "index": (j + 1)};
            postDatas.push(data);
        }
    }
    console.log(postDatas);
    var da = JSON.stringify({time: document.getElementById("selectroutetime").value, routeinfo: postDatas});
    $.ajax({
        type: 'POST',
        url: ip + '/users/changeRouteByTime',
        data: da,
        contentType: "application/json",
        async: true,
        success: function (data) {
            console.log(data);
            $.gritter.add({
                title: '<b style="color: #cf4749;">保存成功！</b>',
                text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;路线数据已成功同步到数据库。正在刷新地图...可点击<b style="color: #cf4749;">生成站点</b>按钮撤销全部更改，重新生成站点'
                + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;正在自动生成最新司机排班表...可前往<b style="color: #cf4749;">信息管理</b><b style="color: #ec7d7d;"> > </b><b style="color: #cf4749;">司机排班</b>查看排班详情',
                class_name: 'gritter-light',
                sticky: false,
                time: ''
            });
            reload();
        },
        error: function () {
            alert("wrong");
        }
    });
}
function refreshMap(ifRefreshMarker) {
    var route = [];
    if (ifRefreshMarker) {
        map.clearOverlays();
        stationArr = [];
    } else {
    }
    for (var i = 0; i < routes.length; i++) {
        route[i] = [];
        route[i].push(COMPANYADDR);
        for (var j = 0; j < routes[i].stations.length; j++) {
            var station = routes[i].stations[j];
            var pos = station.posx + "|" + station.posy;
            var point = {
                id: station.id,
                pos: new BMap.Point(station.posx, station.posy),
                name: station.name,
                address: station.address,
                num: station.num,
                time: station.time
            };
            route[i].push(point.pos);
            if (ifRefreshMarker) {
                var marker = [{
                    title: station.name,
                    content: station.address,
                    num: station.num,
                    point: pos,
                    isOpen: 0,
                    icon: {w: (map.getZoom() - 8) * 5, h: (map.getZoom() - 8) * 5, l: 0, t: 0, x: 6, lb: 5},
                    id: station.id,
                    type: 1
                }];
                if (station.address == '') {
                    var p = new BMap.Point(station.posx, station.posy);
                    getAddByPos(p, point, marker, function (point, marker, s) {
                        //point.address = s;
                        marker[0].content = s;
                        for(var i=0;i<stationArr.length;i++){
                            if(stationArr[i].id==point.id){
                                stationArr[i].address=s;
                            }
                        }
                        stationArr.push(point);
                        addMarker(marker);
                    });
                }
                else {
                    addMarker(marker);
                }
                stationArr.push(point);
            }
        }
        createRoute(route[i], routes[i].route.id);
    }
}
function routePlanning(arg_0) {
    ifAddMarker = false;
    btn_addMarker.innerHTML = '<p><div class="btn red"><i  class="icon-edit"></i> 添加站点</div></p>';
    console.log("generate path");
    console.log(parseSimplePointArr(stationArr));
    console.log(ip + "/RoutePlanning/generatePath");
    $.ajax({
        url: ip + "/RoutePlanning/generatePath",
        type: 'post',
        dataType: "json",
        data: {
            points: parseSimplePointArr(stationArr)//,
            // policy:arg_0 路线生成策略
        },
        success: function (data) {
            $("#routewaitBar").css('width', '0%');
            var routeId = startId;
            routes = [];
            for (var i = 0; i < data.length; i++) {
                routes[i] = {route: {id: routeId}, stations: data[i]};
                routeId++;
            }
            newRouteIndex = routes.length;
            console.log(data);
            $("#route-generate").modal('show');
        }
    });
    //$("#route-generate").modal('hide');
}

var routewaitBartotal = 0;
var routewaitBarnum = 0;
var routewaitJoke = 0;

function waitBarFinish(num) {
    routewaitBarnum += num;
    console.log(routewaitBarnum);
    var temRate = parseInt(routewaitBarnum / (routewaitBartotal + routewaitJoke) * 100);
    $("#routewaitBar").css('width', temRate + '%');
    if (temRate >= 99) $("#route-generate").modal('hide');
}

$('#route-generate').on('shown.bs.modal', function () {
    $("#routewaitBar").css('width', '0%');
    var route = [];
    map.clearOverlays();
    stationArr = [];
    var sum = 0;
    var num = routes.length;
    if (num == 0) {
        $("#route-generate").modal('hide');
        return;
    }
    routewaitBarnum = 0;
    routewaitBartotal = 1.5 * num;
    routes.map(function (troute) {
        route = [];
        route.push(COMPANYADDR);
        for (var j = 0; j < troute.stations.length; j++) {
            var station = troute.stations[j];
            /*if(station.address==''){
             var p  = new BMap.Point( station.posx,station.posy);
             getAddByPos(p);
             station.address = $("#getAddByPointResult").val();
             }*/
            var pos = station.posx + "|" + station.posy;
            var point = {
                id: station.id,
                pos: new BMap.Point(station.posx, station.posy),
                name: station.name,
                address: station.address,
                num: station.num,
                time: station.time
            };
            route.push(point.pos);
            //var string="地址: "+station.address+"<br> 站点人数: "+station.num;
            var marker = [{
                title: station.name,
                content: station.address,
                num: station.num,
                point: pos,
                isOpen: 0,
                icon: {w: (map.getZoom() - 8) * 5, h: (map.getZoom() - 8) * 5, l: 0, t: 0, x: 6, lb: 5},
                id: station.id,
                type: 1
            }];
            if (station.address == '') {
                var p = new BMap.Point(station.posx, station.posy);
                getAddByPos(p, point, marker, function (point, marker, s) {
                    //point.address = s;
                    marker[0].content = s;
                    for(var i=0;i<stationArr.length;i++){
                            if(stationArr[i].id==point.id){
                                stationArr[i].address=s;
                            }
                        }
                    addMarker(marker);
                });
            }
            else {
                addMarker(marker);
            }
            stationArr.push(point);
        }
        routewaitBarnum += 0.5;
        console.log(routewaitBarnum);
        var temRate = parseInt(routewaitBarnum / (routewaitBartotal) * 100);
        //document.createElement("routewaitBar").style.width=temRate+'%';
        $("#routewaitBar").css('width', temRate + '%');
        createRoute(route, troute.route.id);
    })
    /*for(var i=0;i<routes.length;i++){
     route[i]=[];
     route[i].push(COMPANYADDR);
     for(var j=0;j<routes[i].stations.length;j++){
     var station = routes[i].stations[j];
     var pos = station.posx + "|" + station.posy;
     var point = {id:station.id,pos:new BMap.Point(station.posx,station.posy),name:station.name,address:station.address,num:station.num,time:station.time};
     route[i].push(point.pos);
     var marker = [{title:station.name,content:station.address,point:pos,isOpen:0,icon:{w:(map.getZoom()-8)*5,h:(map.getZoom()-8)*5,l:0,t:0,x:6,lb:5},id:station.id,type:1}];
     stationArr.push(point);
     addMarker(marker);
     }
     createRoute(route[i],routes[i].route.id);
     var temRate = parseInt((i+1)/routes.length*70)+10;
     $("#routewaitBar").css('width', temRate+'%');
     }*/
    if (gridster) {
        gridster.remove_all_widgets(null);
        for (var i = 0; i < routes.length; i++) {
            var col = i + 2;
            for (var j = 0; j < routes[i].stations.length; j++) {
                var row = j + 1;
                var html = "<li id='" + routes[i].stations[j].id + "'data-row='" + row + "' data-col='" + col + "' data-sizex='1' data-sizey='1' style='background:" + COLOR[routes[i].route.id % COLOR.length] + " '> " + "<span style='display: none' class='id'>" + routes[i].stations[j].id + "</span>" + routes[i].stations[j].name + "</li>";
                gridster.add_widget(html, 1, 1, col, row);
            }
        }
    }
    $("#route-generate").modal('hide');
})

function reload() {
    console.log("reload");
    routes = [];
    startId = 0;
    newRouteIndex = 0;
    stationCount = 1;
    getData();
    $("#routewaitBar").css('width', '0%');
    $("#route-generate").modal('show');
}
function cleanRoute(routeId) {
    var allOverlay = map.getOverlays();
    console.log(routeId);
    for (var i = 0; i < allOverlay.length; i++) {
        console.log(routeId);
        if (allOverlay[i].type == 2) {
            console.log(allOverlay[i].routeId);
            if (allOverlay[i].routeId == routeId) {
                map.removeOverlay(allOverlay[i]);
            }
        }
    }
}
jQuery(document).ready(function () {
    $('#gritter-help').click(function () {
        $.gritter.add({
            title: '操作说明：',
            text: '<p style="font-family: 微软雅黑">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;每个方块代表一个车站，按行驶顺序排列，每一列为一条路线。'
            + '通过<b style="color: #f6ec59;">拖放</b>方块的方式进行路线的增删与修改。</p>'
            + '<p style="font-family: 微软雅黑">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;点击<b style="color: #f6ec59;">生成路线</b>，将根据所有站点生成最佳路线。生成结果<b style="color: #f6ec59;">不会</b>自动保存。</p>'
            + '<p style="font-family: 微软雅黑">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;点击<b style="color: #f6ec59;">重置地图</b>，将撤销所有更改，恢复上一次保存结果。</p>'
            + '<p style="font-family: 微软雅黑">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;离开页面前点击<b style="color: #f6ec59;">保存</b>按钮保存所有最新的站点及路线。第一列为未加入路线规划的站点，<b style="color: #f6ec59;">默认舍弃</b>。</p>',
            sticky: true//,
            //time: ''
        });
        return false;
    });
});
$('#grid .gs_w').live('mouseover', function (e) {
    var col = $(this).attr('data-col') - 2;
    var routeId = 0;
    if (col < newRouteIndex) {
        routeId = routes[col].route.id;
    } else {
        routeId = startId + col - newRouteIndex;
    }
    var allOverlay = map.getOverlays();
    for (var i = 0; i < allOverlay.length; i++) {
        if (allOverlay[i].type == 2) {
            if (allOverlay[i].routeId == routeId) {
                allOverlay[i].setStrokeWeight(allOverlay[i].getStrokeWeight()*1.5);
            }
        }
    }
});
$('#grid .gs_w').live('mouseout', function (e) {
    var col = $(this).attr('data-col') - 2;
    var routeId = 0;
    if (col < newRouteIndex) {
        routeId = routes[col].route.id;
    } else {
        routeId = startId + col - newRouteIndex;
    }
    var allOverlay = map.getOverlays();
    for (var i = 0; i < allOverlay.length; i++) {
        if (allOverlay[i].type == 2) {
            if (allOverlay[i].routeId == routeId) {
                allOverlay[i].setStrokeWeight(allOverlay[i].getStrokeWeight()/1.5);
            }
        }
    }
});