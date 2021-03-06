/**
 * Created by zouwenyun on 2016/6/30.
 */

var btn_addMarker = document.getElementById("addMarker");
//住址数组
var markerArr = [];
//站点数组
var stationArr = [];
var IP = ip + "/RoutePlanning/";
var COLOR = ["#ed423e", "#19f819", "#136de7", "#f5e20c", "#CC0066", "#009999", "#4c4c93", "#FF6600", "#06a8aa"];
var ifAddMarker = false;
var stationCount = 1;

//var geoCoder=null;
btn_addMarker.onclick = function () {
    if (ifAddMarker == true) {
        ifAddMarker = false;
        btn_addMarker.innerHTML = '<p><div class="btn green"><i  class="icon-plus"></i> 添加站点</div></p>';
    } else {
        ifAddMarker = true;
        btn_addMarker.innerHTML = '<p><div class="btn green"><i class="icon-stop"></i> 停止添加</div></p>';
    }
};

function checkhHtml5() {
    var style = true;
    if (typeof(Worker) === "undefined") {
        if (navigator.userAgent.indexOf("MSIE 9.0") <= 0) {
            style = false;
        }
    }
    if (style == true) {
        var mapStyle = {
            features: ["road", "building", "water", "land"], //隐藏地图上的poi
            style: "normal"
        }
        window.map.setMapStyle(mapStyle);
    }
}

//创建和初始化地图函数
function initMap() {
    createMap(); //创建地图
    setMapEvent(); //设置地图事件
    addMapControl(); //向地图添加控件
    var home = new BMap.Marker(COMPANYADDR);
    var icon = new BMap.Icon("media/image/company.png", new BMap.Size(100, 100));
    home.setIcon(icon);
    home.disableMassClear();
    map.addOverlay(home);
    var label = new BMap.Label("公司",{offset:new BMap.Size(40,-5)});
    home.setLabel(label);
    map.setMapStyle({style:'grayscale'});

}

//创建地图函数
function createMap() {
    var map = new BMap.Map("dituContent", {enableMapClick: false}); //在百度地图容器中创建地图
    map.centerAndZoom(COMPANYADDR, 12); //设定地图的中心点和坐标并将地图显示在地图容器中
    window.map = map; //将map变量存储在全局
    checkhHtml5();
    //geoCoder=new BMap.Geocoder();
}

//地图事件设置函数：
function setMapEvent() {
    map.enableDragging(); //启用地图拖拽事件，默认启用(可不写)
    map.enableScrollWheelZoom(); //启用地图滚轮放大缩小
    map.enableDoubleClickZoom(); //启用鼠标双击放大，默认启用(可不写)
    map.enableKeyboard(); //启用键盘上下左右键移动地图
}
//地图控件添加函数：
function addMapControl() {
    //向地图中添加缩放控件
    var ctrl_nav = new BMap.NavigationControl({
        anchor: BMAP_ANCHOR_TOP_LEFT,
        type: BMAP_NAVIGATION_CONTROL_LARGE,
        enableGeolocation: true
    });
    map.addControl(ctrl_nav);
    //向地图中添加比例尺控件
    var ctrl_sca = new BMap.ScaleControl({anchor: BMAP_ANCHOR_BOTTOM_LEFT});
    map.addControl(ctrl_sca);

    //添加自定义控件

    // 定义一个控件类,即function
    function ZoomControl(){
        // 默认停靠位置和偏移量
        this.defaultAnchor = BMAP_ANCHOR_TOP_LEFT;
        this.defaultOffset = new BMap.Size(10, 230);
    }

    // 通过JavaScript的prototype属性继承于BMap.Control
    ZoomControl.prototype = new BMap.Control();

    // 自定义控件必须实现自己的initialize方法,并且将控件的DOM元素返回
    // 在本方法中创建个div元素作为控件的容器,并将其添加到地图容器中
    ZoomControl.prototype.initialize = function(map){
        // 创建一个DOM元素
        var div = document.createElement("div");
        // 添加文字说明
        div.appendChild(document.createTextNode("定位到公司"));
        // 设置样式
        div.style.cursor = "pointer";
        div.style.border = "2px solid red";
        div.style.backgroundColor = "white";
        // 绑定事件,点击一次放大两级
        div.onclick = function(e){
            map.panTo(COMPANYADDR);                //转到该点位置
        }
        // 添加DOM元素到地图中
        map.getContainer().appendChild(div);
        // 将DOM元素返回
        return div;
    }
    // 创建控件
    var myZoomCtrl = new ZoomControl();
    // 添加到地图当中
    map.addControl(myZoomCtrl);
}

//创建marker
function addMarker(Arr) {
    for (var i = 0; i < Arr.length; i++) {
        var json = Arr[i];
        var p0 = json.point.split("|")[0];
        var p1 = json.point.split("|")[1];
        var point = new BMap.Point(p0, p1);
        var iconImg = createIcon(json.icon, json.type);
        var marker = new BMap.Marker(point, {icon: iconImg});
        marker.id = json.id;
        marker.type = json.type;
        marker.enableDragging();
        marker.addEventListener('dragend', function (event) {
            console.log(event);
            var tMarker = event.target;
            if (tMarker.type == 0) {
                var index = indexOf(tMarker, markerArr);
                if (index != -1) {
                    markerArr[index].pos.lng = event.point.lng;
                    markerArr[index].pos.lat = event.point.lat;
                }
            } else if (tMarker.type == 1) {
                var index = indexOf(tMarker, stationArr);
                if (index != -1) {
                    stationArr[index].pos.lng = event.point.lng;
                    stationArr[index].pos.lat = event.point.lat;
                    changeHints();
                }
            }
        });

        var label = new BMap.Label(json.title, {"offset": new BMap.Size(json.icon.lb - json.icon.x + 10, -20)});
        label.hide();
        map.addOverlay(marker);
        marker.setLabel(label);
        label.setStyle({
            borderColor: "#808080",
            color: "#333",
            cursor: "pointer"
        });
        stationMarkerArr.push(marker);
        var iw = (function () {
            var index = i;
            var _iw = createInfoWindow(json);
            var _marker = marker;
            _marker.addEventListener("click", function () {
                this.openInfoWindow(_iw);
            });
            _iw.addEventListener("open", function () {
                //_marker.getLabel().hide();
            });
            _iw.addEventListener("close", function () {
                //_marker.getLabel().show();
            });
            if (!!json.isOpen) {
                label.hide();
                _marker.openInfoWindow(_iw);
            }
            return _iw;
        })();
        MarkerRightClickHandler(marker, iw);
    }
    changeHints();
}

//创建InfoWindow
function createInfoWindow(json) {
    var title = {title: '<span style="font-size:14px;color:#0A8021">' + json.title + '</span>'};
    console.log(json);
    if(typeof(json.num) == "undefined"){
        json.num = 0;
    }

    var iw = new BMap.InfoWindow('<b>站名: </b>' + json.title + '</br><b>站点人数: </b>' + json.num
        + '</br><b>地址:</b>' + json.content + '</br>' + '<div style="line-height:1.8em;font-size:12px;"><b>经纬度坐标: </b>'+json.point+'</br>'
        + '</br><b><a class="btn blue" style="float:left;margin-left:15px;" href="#" onclick="editStation('+json.id+')" /><i class="icon-edit"></i> 编辑</a>'
        + '</span><a href="#" onclick="deleteStation('+json.id+')" class="btn red" style="float:left;margin-left:35px;" ><i class="icon-trash"> 删除</i></a>', title)
    ;
    //var iw = new BMap.InfoWindow(); //("<b class='iw_poi_title' title='" + json.title + "'>" + json.title + "</b><div class='iw_poi_content'>"+json.content+"</div>");
    //iw.setTitle(json.title);
    //iw.setContent(json.content);
    return iw;
}
//创建一个Icon
function createIcon(json, type) {
    var icon = null;
    if (type == 0) {
        icon = new BMap.Icon("media/image/map/star.png", new BMap.Size(json.w, json.h), {
            imageOffset: new BMap.Size(-json.l, -json.t),
            infoWindowOffset: new BMap.Size(json.lb + 5, 1),
            offset: new BMap.Size(json.x, json.h)
        })
    } else {
        icon = new BMap.Icon("media/image/map/station.png", new BMap.Size(json.w, json.h), {
            imageOffset: new BMap.Size(-json.l, -json.t),
            infoWindowOffset: new BMap.Size(json.lb + 5, 1),
            offset: new BMap.Size(json.x, json.h)
        })
    }
    return icon;
}

function createRoute(markers, routeID) { //markers是一个Point数组
    var routeId = parseInt(routeID);
    var label;
    for (var j = 0; j < routes.length; j++) {
        if (routes[j].route.id == routeId) {
            console.log(routes[j].route);
            var string = "id: " + routes[j].route.id + "<br>  name: " + routes[j].route.name;
            label = new BMap.Label(string, {"offset": new BMap.Size(0, -20)});
            label.hide();
            map.addOverlay(label);
        }
    }
    var group = Math.floor(markers.length / 10);
    var mode = markers.length % 10;
    var tgnum = group;
    if (mode != 0) tgnum += 1;
    var driving = new BMap.DrivingRoute(map, {
        renderOptions: { //绘制结果
            map: map,
            autoViewport: false,
            enableDragging: true
        },
        onSearchComplete: function (results) {
            waitBarFinish(1 / tgnum);
            if (driving.getStatus() == BMAP_STATUS_SUCCESS) {
                var color = COLOR[(routeId % COLOR.length)];
                //console.log(driving.getResults());
                //console.log(driving.getResults().getPlan(0));
                if (driving.getResults() == null)   return;
                if (driving.getResults().getNumPlans() == 0)   return;
                var plan = driving.getResults().getPlan(0);
                var num = plan.getNumRoutes();
                for (var i = 0; i < num; i++) {
                    var pts = plan.getRoute(i).getPath(); //通过驾车实例，获得一系列点的数组
                    //console.log(pts);
                    var polyline1=new BMap.Polyline(pts, {strokeColor: "#000000", strokeWeight: 10, strokeOpacity: 0.9});
                    polyline1.type = 2;
                    polyline1.routeId = routeId;
                    map.addOverlay(polyline1);
                    var polyline2=new BMap.Polyline(pts, {strokeColor: "#FFFFFF", strokeWeight: 8, strokeOpacity: 0.9});
                    polyline2.type = 2;
                    polyline2.routeId = routeId;
                    map.addOverlay(polyline2);
                    var polyline = new BMap.Polyline(pts, {strokeColor: color, strokeWeight: 6, strokeOpacity: 0.9});
                    polyline.type = 2;
                    polyline.routeId = routeId;
                    polyline.label = label;
                    polyline.mark = new BMap.Marker(pts[0]);
                    var icon = polyline.mark.getIcon(); 
                    icon.setImageSize(new BMap.Size(0, 0))
                    //polyline.mark.hide();
                    map.addOverlay(polyline.mark);
                    //polyline.label= new BMap.Label(routes[routeId].route);
                    polyline.addEventListener("mouseover", function (e) {
                        polyline.label.setPosition(e.point);
                        //polyline.label.show();
                        var allOverlay = map.getOverlays();
                        for (var i = 0; i < allOverlay.length; i++) {
                            if (allOverlay[i].type == 2) {
                                if (allOverlay[i].routeId == polyline.routeId) {
                                    allOverlay[i].setStrokeWeight(allOverlay[i].getStrokeWeight()*1.5);
                                }
                            }
                        }
                    })
                    polyline.addEventListener("mouseout", function (e) {
                        var allOverlay = map.getOverlays();
                        //polyline.label.hide();
                        for (var i = 0; i < allOverlay.length; i++) {
                            if (allOverlay[i].type == 2) {
                                if (allOverlay[i].routeId == polyline.routeId) {
                                    allOverlay[i].setStrokeWeight(allOverlay[i].getStrokeWeight()/1.5);
                                }
                            }
                        }
                    })
                    polyline.addEventListener("click", function (e) {
                        if (polyline.infowindow == null) {
                            console.log("here");
                            polyline.infowindow = new BMap.InfoWindow();
                            var d = new Date();
                            d.setDate(d.getDate() - 1);
                            var da = JSON.stringify({
                                id: polyline.routeId,
                                date: d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate()
                            });
                            $.ajax({
                                type: 'POST',
                                url: ip + '/users/getRideRateByRoute',
                                //url:"http://127.0.0.1:3000/users/getRideRateByRoute",
                                data: da,
                                contentType: "application/json",
                                async: false,
                                success: function (data) {
                                    var tstring = "";
                                    tstring = polyline.label.getContent() + "<br> 路线总人数： " + data.aroundRoute + "<br> 昨日乘车人数： " + data.realRideNum;
                                    console.log(tstring);
                                    polyline.infowindow.setContent(tstring);
                                    polyline.infowindow.redraw();
                                    //aroundRoute=data.aroundRoute;
                                    //realRide=data.realRideNum;
                                },
                                error: function () {
                                    alert("wrong");
                                }
                            });
                            polyline.infowindow.enableCloseOnClick();
                            polyline.infowindow.setPosition(e.point);
                            polyline.mark.setPosition(e.point);
                            map.addOverlay(polyline.infowindow);
                            polyline.mark.openInfoWindow(polyline.infowindow);
                        }
                        else {
                            console.log("here2");
                            polyline.infowindow.setPosition(e.point);
                            polyline.mark.setPosition(e.point);
                            polyline.mark.openInfoWindow(polyline.infowindow);
                        }
                    })
                    map.addOverlay(polyline);
                    PolylineRightClickHandler(polyline);
                }
                driving.clearResults();
            }
        }
    });
    driving.setPolicy(BMAP_DRIVING_POLICY_LEAST_DISTANCE);
    for (var i = 0; i < group; i++) {
        var waypoints = markers.slice(i * 10 + 1, (i + 1) * 10);
        driving.search(markers[i * 10], markers[(i + 1) * 10], {waypoints: waypoints}); //waypoints表示途经点
    }
    if (mode != 0) {
        var waypoints = markers.slice(group * 10, markers.length - 1); //多出的一段单独进行search
        driving.search(markers[group * 10], markers[markers.length - 1], {waypoints: waypoints});
    }
}

//右键单击marker出现右键菜单事件
var ok_1 = document.getElementById("portlet-remove-ok");
var ok_2 = document.getElementById("portlet-update-ok");
var txt_title = document.getElementById("title");
var txt_content = document.getElementById("content");

function PolylineRightClickHandler(polyline) {
    var removePolyline = function (e, ee, polyline) { //右键删除站点
        $("#portlet-remove").modal('show');
        ok_1.onclick = function () {
            map.removeOverlay(polyline);
            $("#portlet-remove").modal('hide');
        };
    };
    var editPolyline = function () { //右键更新站名
        polyline.enableEditing();
        menuItem_edit.disable();
        menuItem_save.enable();
    };
    var savePolyline = function () { //右键更新站名
        polyline.disableEditing();
        menuItem_save.disable();
        menuItem_edit.enable();
    };
    var polylineMenu = new BMap.ContextMenu();
    var menuItem_remove = new BMap.MenuItem('删除路线', removePolyline.bind(polyline));
    var menuItem_edit = new BMap.MenuItem('编辑', editPolyline.bind(polyline));
    var menuItem_save = new BMap.MenuItem('保存修改', savePolyline.bind(polyline));
    polylineMenu.addItem(menuItem_remove);
    polylineMenu.addItem(menuItem_edit);
    polylineMenu.addItem(menuItem_save);
    menuItem_save.disable();
    polyline.addContextMenu(polylineMenu); //给标记添加右键菜单
}

function indexOf(marker, arr) {
    var arrLength = arr.length;
    for (var i = 0; i < arrLength; i++) {
        if (marker == arr[i].id || marker.id == arr[i].id)
            return i;
    }
    return -1;
}

//搜索功能：站点查询
$(document).ready(function () {
    //Sample 2
    $('#stations_select2').select2({
        placeholder: "站点名称...",
        allowClear: true
    });
    $('#stations_select2').change(function () {
        var index = parseInt($("#stations_select2").get(0).selectedIndex) - 1;
        var id = stationArr[index].id;
        setPlace(id);
    });
});
//根据经纬度解析出地址

function getAddByPos(point,point2,marker,cb){
    var geoc = new BMap.Geocoder();
    geoc.getLocation(point, function(rs){
        var addComp = rs.addressComponents;
        var address =  addComp.province + ", " + addComp.city + ", " + addComp.district + ", " + addComp.street + ", " + addComp.streetNumber;
        console.log(address);
        cb(point2,marker,address);
    });
}

//搜索功能：线路查询
$(document).ready(function () {
    //Sample 2
    $('#routes_select2').select2({
        placeholder: "线路名称...",
        allowClear: true
    });
    $('#routes_select2').change(function () {
        var i = parseInt($("#routes_select2").get(0).selectedIndex) - 1;
        var id = routes[i].route.id;
        map.clearOverlays();
        var route = [];
        for (var j = 0; j < routes[i].stations.length; j++) {
            var station = routes[i].stations[j];
            var pos = station.posx + "|" + station.posy;
            var point = new BMap.Point(station.posx, station.posy);
            route.push(point);
            var marker = [{
                title: station.name,
                content: station.address,
                point: pos,
                isOpen: 0,
                icon: {w: 15, h: 20, l: 0, t: 0, x: 6, lb: 5},
                id: station.id,
                type: 1
            }];
            addMarker(marker);
        }
        createRoute(route, id);
    });
});

function setPlace(id) {
    //找到所有站点，比较名字
    for (var i = 0; i < stationArr.length; i++) {
        if (stationArr[i].id == id) { //if(names[i].name==name){
            //var pos=new BMap.Point(names[i].pos.lng,names[i].pos.lat);
            map.centerAndZoom(stationArr[i].pos, 18);
        }
    }
}

function changeHints() {
    $('#stations_select2').empty();
    $('#stations_select2').append('<option value=""></option>');
    for (var i = 0; i < stationArr.length; i++) {
        $('#stations_select2').append('<option><span style="font-size: 20px">' + stationArr[i].name + '</span><span  style="font-size: 10px">' + stationArr[i].pos.lat + '\'N,' + stationArr[i].pos.lng + '\'E' + '</span></option>');
    }

    $('#routes_select2').empty();
    $('#routes_select2').append('<option value=""></option>');
    for (var i = 0; i < routes.length; i++) {
        $('#routes_select2').append('<option><span style="font-size: 20px">' + routes[i].route.name + '</span></option>');
    }
}

function parseSimplePointArr(points) {
    pointsArr = [];
    for (var i = 0; i < points.length; i++) {
        pointsArr[i] = {
            "x": points[i].pos.lng,
            "y": points[i].pos.lat,
            "name": points[i].name,
            "id": points[i].id,
            "address": points[i].address,
            "num": points[i].num
        };
    }
    return pointsArr;
}