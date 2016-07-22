/**
 * Created by zouwenyun on 2016/6/30.
 */

var btn_addMarker = document.getElementById("addMarker");
var btn_upload = document.getElementById("upload");
//住址数组
var markerArr = [];
//站点数组
var stationArr =[];
var IP="http://192.168.1.4:3000/RoutePlanning/";
var COLOR=["#FF9900","#333333","#548C00","##009933","#CC0066","#009999","#666699","#FF6600","#8F4586"];
var routeCount=0;
var ifAddMarker = false;
var stationCount = 1;
var driving =null;

btn_addMarker.onclick = function(){
    if(ifAddMarker==true){
        ifAddMarker=false;
        btn_addMarker.innerHTML='<p><div class="btn red"><i  class="icon-edit"></i> 添加站点</div></p>';
    }else{
        ifAddMarker=true;
        btn_addMarker.innerHTML='<p><div class="btn green"><i class="icon-stop"></i> 停止添加</div></p>';
    }
};
btn_upload.onclick = function () {
    console.log("upload click");
    var ajax_option={
        url:IP+"upLoadFile",
        success:function (data) {
            console.log(data);
        }
    };
    $("#fileForm").ajaxSubmit(ajax_option);
};

function checkhHtml5(){
    var style=true;
    if (typeof(Worker) === "undefined"){
        if(navigator.userAgent.indexOf("MSIE 9.0")<=0){
            style=false;
        }
    }
    if(style==true){
        var  mapStyle ={
            features: ["road", "building","water","land"],//隐藏地图上的poi
            style : "light"
        }
        window.map.setMapStyle(mapStyle);
    }
}

//创建和初始化地图函数
function initMap(){
    createMap();//创建地图
    setMapEvent();//设置地图事件
    addMapControl();//向地图添加控件
}

//创建地图函数
function createMap(){
    var map = new BMap.Map("dituContent",{enableMapClick:false});//在百度地图容器中创建地图
    var point = new BMap.Point(121.448892,31.028955);//定义一个中心点坐标
    map.centerAndZoom(point,14);//设定地图的中心点和坐标并将地图显示在地图容器中
    window.map = map;//将map变量存储在全局
    checkhHtml5();
    driving = new BMap.DrivingRoute(map, {
        renderOptions: {//绘制结果
            map: map,
            autoViewport: true,
            enableDragging: true
        },
        onSearchComplete: function(results){
            if (driving.getStatus() == BMAP_STATUS_SUCCESS) {
                var color = COLOR[(routeCount%COLOR.length)];
                var plan = driving.getResults().getPlan(0);
                var num = plan.getNumRoutes();
                for(var i=0;i<num;i++){
                    var pts = plan.getRoute(i).getPath();   //通过驾车实例，获得一系列点的数组
                    var polyline = new BMap.Polyline(pts,{strokeColor: color, strokeWeight: 6, strokeOpacity: 0.9});
                    polyline.type=2;
                    //polyline.routeId=routeCount;
                    map.addOverlay(polyline);
                    PolylineRightClickHandler(polyline);
                }
                routeCount++;
                driving.clearResults();
            }
        }
    });
    driving.setPolicy(BMAP_DRIVING_POLICY_LEAST_DISTANCE);
}

//地图事件设置函数：
function setMapEvent(){
    map.enableDragging();//启用地图拖拽事件，默认启用(可不写)
    map.enableScrollWheelZoom();//启用地图滚轮放大缩小
    map.enableDoubleClickZoom();//启用鼠标双击放大，默认启用(可不写)
    map.enableKeyboard();//启用键盘上下左右键移动地图
    map.addEventListener("click", function(e){
        var pos = e.point.lng + "|" + e.point.lat;
        if(ifAddMarker==true){//添加站点
            var marker = [{title:"站点_"+stationCount,content:"通过在页面点击添加",point:pos,isOpen:0,icon:{w:32,h:40,l:0,t:0,x:6,lb:5},id:-stationCount,type:1}];
            var point = {id:-stationCount,pos:new BMap.Point(e.point.lng,e.point.lat),name:"站点_"+stationCount};
            stationArr.push(point);
            stationCount++;
            addMarker(marker);
        }
    });
}
//地图控件添加函数：
function addMapControl(){
    //向地图中添加缩放控件
    var ctrl_nav = new BMap.NavigationControl({anchor:BMAP_ANCHOR_TOP_LEFT,type:BMAP_NAVIGATION_CONTROL_LARGE});
    map.addControl(ctrl_nav);
    //向地图中添加比例尺控件
    var ctrl_sca = new BMap.ScaleControl({anchor:BMAP_ANCHOR_BOTTOM_LEFT});
    map.addControl(ctrl_sca);
}

//创建marker
function addMarker(Arr){
    for(var i=0;i<Arr.length;i++){
        var json = Arr[i];
        var p0 = json.point.split("|")[0];
        var p1 = json.point.split("|")[1];
        var point = new BMap.Point(p0,p1);
        var iconImg = createIcon(json.icon,json.type);
        var marker = new BMap.Marker(point,{icon:iconImg});

        marker.id=json.id;
        marker.type=json.type;
        marker.enableDragging();
        marker.addEventListener('dragend',function(event){
            console.log(event);
            var tMarker = event.target;
            if(tMarker.type==0){
                var index = indexOf(tMarker,markerArr);
                if(index!=-1){
                    markerArr[index].pos.lng=event.point.lng;
                    markerArr[index].pos.lat=event.point.lat;
                }
            }else if(tMarker.type==1){
                var index = indexOf(tMarker,stationArr);
                if(index!=-1){
                    stationArr[index].pos.lng=event.point.lng;
                    stationArr[index].pos.lat=event.point.lat;
                    changeHints();
                }
            }
        });
        
        var label = new BMap.Label(json.title,{"offset":new BMap.Size(json.icon.lb-json.icon.x+10,-20)});
        marker.setLabel(label);
        map.addOverlay(marker);
        label.setStyle({
            borderColor:"#808080",
            color:"#333",
            cursor:"pointer"
        });

        var iw = (function(){
            var index = i;
            var _iw = createInfoWindow(Arr,i);
            var _marker = marker;
            _marker.addEventListener("click",function(){
                this.openInfoWindow(_iw);
            });
            _iw.addEventListener("open",function(){
                _marker.getLabel().hide();
            });
            _iw.addEventListener("close",function(){
                _marker.getLabel().show();
            });
            if(!!json.isOpen){
                label.hide();
                _marker.openInfoWindow(_iw);
            }
            return _iw;
        })();
        MarkerRightClickHandler(marker,iw);
    }
    changeHints();
}

//创建InfoWindow
function createInfoWindow(Arr,i){
    var json = Arr[i];
    var iw = new BMap.InfoWindow("<b class='iw_poi_title' title='" + json.title + "'>" + json.title + "</b><div class='iw_poi_content'>"+json.content+"</div>");
    return iw;
}
//创建一个Icon
function createIcon(json,type){
    var icon = null;
    if(type==0){
        icon = new BMap.Icon("media/image/map/star.png", new BMap.Size(json.w,json.h),{imageOffset: new BMap.Size(-json.l,-json.t),infoWindowOffset:new BMap.Size(json.lb+5,1),offset:new BMap.Size(json.x,json.h)})
    }else{
        icon = new BMap.Icon("media/image/map/station.png", new BMap.Size(json.w,json.h),{imageOffset: new BMap.Size(-json.l,-json.t),infoWindowOffset:new BMap.Size(json.lb+5,1),offset:new BMap.Size(json.x,json.h)})
    }return icon;
}

//向地图中添加线函数
function addPolyline(plPoints){
    for(var i=0;i<plPoints.length;i++){
        var json = plPoints[i];
        var points = [];
        for(var j=0;j<json.points.length;j++){
            var p1 = json.points[j].split("|")[0];
            var p2 = json.points[j].split("|")[1];
            points.push(new BMap.Point(p1,p2));
        }
        var line = new BMap.Polyline(points,{strokeStyle:json.style,strokeWeight:json.weight,strokeColor:json.color,strokeOpacity:json.opacity});
        map.addOverlay(line);
    }
}

function getRoute(pointStart,pointEnd) {
    driving.clearResults();
    driving.search(pointStart, pointEnd);
}

function createRoute(markers) {//markers是一个Point数组
    var  group = Math.floor( markers.length /11 ) ;
    var mode = markers.length %11 ;
    for(var i =0;i<group;i++){
        var waypoints = markers.slice(i*11+1,(i+1)*11);
        driving.search(markers[i*11], markers[(i+1)*11],{waypoints:waypoints});//waypoints表示途经点
    }
    if( mode != 0){
        var waypoints = markers.slice(group*11,markers.length-1);//多出的一段单独进行search
        driving.search(markers[group*11],markers[markers.length-1],{waypoints:waypoints});
    }
}

//右键单击marker出现右键菜单事件
var ok_1 = document.getElementById("portlet-remove-ok");
var ok_2 = document.getElementById("portlet-update-ok");
var txt_title = document.getElementById("title");
var txt_content = document.getElementById("content");
function MarkerRightClickHandler(marker,iw){
    var label = marker.getLabel();
    var removeMarker = function(e,ee,marker) {//右键删除站点
        $("#portlet-remove").modal('show');
        ok_1.onclick = function () {
            map.removeOverlay(marker);
            $("#portlet-remove").modal('hide');
        };
        if (marker.type == 0) {
            var index = indexOf(marker, markerArr);
            if (index != -1) {
                markerArr.splice(index, 1);
            }
        }else{
            var index = indexOf(marker, stationArr);
            if (index != -1) {
                stationArr.splice(index, 1);
                changeHints();
            }
        }
    };
    var updateMarker = function(){//右键更新站名
        txt_title.value=label.getContent();
        txt_content.value="";
        $("#portlet-update").modal('show');
        ok_2.onclick = function(){
            label.setContent(txt_title.value);
            iw.setContent("<b class='iw_poi_title' title='" + txt_title.value + "'>" + txt_title.value
                + "</b><div class='iw_poi_content'>"+txt_content.value+"</div>");
            iw.redraw();
            $("#portlet-update").modal('hide');
            if (marker.type == 1) {
                var index = indexOf(marker, stationArr);
                if (index != -1) {
                    stationArr[index].name = txt_title.value;
                    changeHints();
                }
            }
        };
    };
    var markerMenu=new BMap.ContextMenu();
    markerMenu.addItem(new BMap.MenuItem('删除站点',removeMarker.bind(marker)));
    markerMenu.addItem(new BMap.MenuItem('修改站点信息',updateMarker.bind(marker)));
    marker.addContextMenu(markerMenu);//给标记添加右键菜单
}
function PolylineRightClickHandler(polyline){
    var removePolyline = function(e,ee,polyline){//右键删除站点
        $("#portlet-remove").modal('show');
        ok_1.onclick = function(){
            map.removeOverlay(polyline);
            $("#portlet-remove").modal('hide');
        };
    };
    var editPolyline = function(){//右键更新站名
        polyline.enableEditing();
        menuItem_edit.disable();
        menuItem_save.enable();
    };
    var savePolyline = function(){//右键更新站名
        polyline.disableEditing();
        menuItem_save.disable();
        menuItem_edit.enable();
    };
    var polylineMenu=new BMap.ContextMenu();
    var menuItem_remove = new BMap.MenuItem('删除路线',removePolyline.bind(polyline));
    var menuItem_edit = new BMap.MenuItem('编辑',editPolyline.bind(polyline));
    var menuItem_save = new BMap.MenuItem('保存修改',savePolyline.bind(polyline));
    polylineMenu.addItem(menuItem_remove);
    polylineMenu.addItem(menuItem_edit);
    polylineMenu.addItem(menuItem_save);
    menuItem_save.disable();
    polyline.addContextMenu(polylineMenu);//给标记添加右键菜单
}

function indexOf(marker,Arr) {
    for(var i=0;i<Arr.length;i++){
        if( marker===Arr[i].id || marker.id == Arr[i].id)
            return i;
    }
    return -1;
}

//点的转换 PA:PointsArray[{x,y}]
//BMPA:BaiduMapPointsArray [{id,BMap.Point:{lng,lat}}]
function PA2BMPA(points,ifNew){
    var pointsArr = [];
    if(ifNew){
        for(var i=0;i<points.length;i++){
            pointsArr[i] = [stationCount,new BMap.Point(points[i].x,points[i].y)];
            stationCount++;
        }
    }else{
        for(var i=0;i<points.length;i++){
            pointsArr[i] = [i,new BMap.Point(points[i].x,points[i].y)];
        }
    }
    return pointsArr;
}
function BMPA2PA(points){
    pointsArr = [];
    for(var i=0;i<points.length;i++){
        pointsArr[i] = {"x": points[i][1].lng,
                            "y":points[i][1].lat};
    }
    return pointsArr;
}

function routePlanning(arg_0){
    ifAddMarker=false;
    btn_addMarker.innerHTML='<p><div class="btn red"><i  class="icon-edit"></i> 添加站点</div></p>';
    console.log("generate path");
    $.ajax({
        url: IP+"generatePath",
        type: 'post',
        dataType: "json",
        data: {
            points:parseSimplePoint(stationArr)//,
           // policy:arg_0 路线生成策略
        },
        success: function(points){
            console.log(points[0]);
            //points 是二维数组,元素：[id,BMap.Point]
            var stations = [];
            for(var i=0;i<points.length;i++){
                stations[i] = PA2BMPA(points[i],false);
            }
            //var stations=PA2BMPA(points,false);
            var markers=[];
            for(var i=0;i<stations.length;i++){
		        markers[i]=new Array();
                for(var j=0;j<stations[i].length;j++){
                    markers[i][j] = stations[i][j][1];
                }
            }
            clearOverlays(2);
            for(var i=0;i<markers.length;i++){
                createRoute(markers[i]);
            }
        }
    });
}
//清理某类覆盖物
function clearOverlays(type) {
    var allOverlay = map.getOverlays();
    //console.log("overlay:"+allOverlay.length);
    for(var i=0;i<allOverlay.length;i++){
        //console.log(i+":"+allOverlay[i].type);
        if(allOverlay[i].type==type){
            map.removeOverlay(allOverlay[i]);
        }
    }
}

//搜索功能：站点查询
$(document).ready(function () {
    //Sample 2
    $('#stations_select2').select2({
        placeholder: "站点名称...",
        allowClear: true
    });
    $('#stations_select2').change(function(){
        var id=stationArr[parseInt($("#stations_select2").get(0).selectedIndex)-1].id;
        setPlace(id);
    });
});
function setPlace(id){
    //找到所有站点，比较名字
    for(var i=0;i<stationArr.length;i++){
        if(stationArr[i].id==id){//if(names[i].name==name){
            //var pos=new BMap.Point(names[i].pos.lng,names[i].pos.lat);
            map.centerAndZoom(stationArr[i].pos, 18);
        }
    }
}
function changeHints() {
    $('#stations_select2').empty();
    $('#stations_select2').append('<option value=""></option>');
    for(var i=0;i<stationArr.length;i++){
        $('#stations_select2').append('<option><span style="font-size: 20px">'+stationArr[i].name+'</span><span  style="font-size: 10px">'+stationArr[i].pos.lat+'\'N,'+stationArr[i].pos.lng+'\'E'+'</span></option>');
    }
}

function parseMarker(points) {
    var pointsArr = [];
    for(var i=0;i<points.length;i++){
        pointsArr[i].pos = new BMap.Point(points[i].x,points[i].y);
        pointsArr[i].id = -stationCount;
        pointsArr[i].name = "未命名站点_"+stationCount;
        stationCount++;
    }
    return pointsArr;
}
function parseSimplePoint(points) {
    pointsArr = [];
    for(var i=0;i<points.length;i++){
        pointsArr[i] = {"x": points[i].pos.lng,
            "y":points[i].pos.lat};
    }
    return pointsArr;
}


