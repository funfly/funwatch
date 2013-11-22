var mongodb  = require('../lib/mongodb');

var chartTitle = {
    cpus:'按"天"查看CPU状态',
    mems:'按"天"查看内存状态',
    ios:'按"天"查看I/O状态',
    loads:'按"天"查看负载状态',
    nets:'按"天"查看网络状态',

    cpu_alls:'按"小时"查看CPU状态',
    mem_alls:'按"小时"查看内存状态',
    io_alls:'按"小时"查看I/O状态',
    load_alls:'按"小时"查看负载状态',
    net_alls:'按"小时"查看网络状态',
    
};
var menuButtons = [
    [
        'CPU',
        "/?type=cpus",
        "/?type=cpu_alls",
    ],
    [
        '内存',
        "/?type=mems",   
        "/?type=mem_alls",   
    ],
    [
        'I/O',
        "/?type=ios", 
        "/?type=io_alls", 
    ],
    [
        '负载',
        "/?type=loads",
        "/?type=load_alls",
    ],
    [
        '网络',
        "/?type=nets",
        "/?type=net_alls",
    ],
];    

exports.serverStatus = function(req, res){
    
    //显示服务器列表
    mongodb.find('servers',function (err,doc) {
        if(err){
            res.send(err);
            return 
        };
        
        if('undefined' != typeof(req.query.type) && 'undefined' != typeof(req.query.ip)){
            if('undefined' == typeof(chartTitle[req.query.type])){
                res.render('serverStatus',{title:'服务器监控',servers:doc,curServer:null,query:req.query,menuButtons:menuButtons,chartDataMax:0,curChartType:null,chartTypes:null,chartData:null,chartTitle:null});
                return;
            }
            
            var curServer;
            for(var k in doc){
                if(doc[k]._id == req.query.ip){
                    curServer = doc[k];
                }
            }

            //获取统计数据
            var fromtime = parseInt(req.query.fromtime);
            var totime = parseInt(req.query.totime);
            var conditions = {};
            if(fromtime && totime){
                conditions = {ip:req.query.ip,time:{$gte:req.query.fromtime,$lte:req.query.totime}};
            }else if(fromtime){
                conditions = {ip:req.query.ip,time:{$gte:req.query.fromtime}};
            }else if(totime){
                conditions = {ip:req.query.ip,time:{$lte:req.query.totime}};
            }
            
            if(req.query.type == 'nets' || req.query.type == 'net_alls'){
                var IFACE = 'eth0';
                if('undefined' != typeof(req.query.IFACE) ){
                    IFACE = req.query.IFACE;
                }
                if(! IFACE){
                    IFACE = 'eth0';
                }
                req.query.IFACE = IFACE;
                conditions.IFACE = IFACE;
                if(curServer && curServer.IFACE ){
                    req.query.ALL_IFACE = JSON.parse(curServer.IFACE);
                }
            }

            mongodb.find(req.query.type,conditions,'-_id -ip',function (err,data) {
                if(err){
                    res.json(err);
                    return 
                };

                var ctitle = '当前服务器：'+req.query.ip+'；'+chartTitle[req.query.type];
                var curChartType = '';
                if('undefined' != typeof(req.query.chartType) ){
                    curChartType = req.query.chartType;
                }
                var chartTypes = new Array();
                var chartData = new Array();
                var chartDataMax;
                if(data && 'undefined' != typeof(data[0]) ){
                    //报表类型
                    var tmp = data[0].toObject();
                    for(var k in tmp){
                        if(k != 'time' && k != 'IFACE' && k != 'cpu'){
                            chartTypes.push(k);
                            if(! curChartType){
                                curChartType = k;
                            }
                        }
                    }
                    req.query.curChartType = curChartType;
                    //报表数据
                    for(var k in data){
                        if('undefined' != typeof(data[k][curChartType]) ){
                            chartData.push(data[k][curChartType]);
                        }
                    }
                    chartDataMax = Math.max.apply({},chartData);
                    
                    var factor = 10;
                    if(chartDataMax < 10){
                        factor = 10;
                    }else if(chartDataMax < 20){
                        factor = 20;
                    }else if(chartDataMax < 50){
                        factor = 50;
                    }else if(chartDataMax < 100){
                        factor = 100;
                    }else if(chartDataMax < 500){
                        factor = 500;
                    }else if(chartDataMax < 1000){
                        factor = 1000;
                    }else if(chartDataMax < 5000){
                        factor = 5000;
                    }else {
                        factor = 10000;
                    }
                    chartDataMax = Math.ceil(chartDataMax/factor)*1.1*factor;
                    chartDataMax = Math.max(1.1*factor,chartDataMax);
                }
                res.render('serverStatus',{title:'服务器监控',servers:doc,curServer:curServer,query:req.query,menuButtons:menuButtons,chartDataMax:chartDataMax,curChartType:curChartType,chartTypes:chartTypes,chartData:chartData,chartTitle:ctitle});
            });
        }else{
            res.render('serverStatus',{title:'服务器监控',servers:doc,curServer:null,query:req.query,menuButtons:menuButtons,chartDataMax:1,curChartType:null,chartTypes:null,chartData:null,chartTitle:null});
        }
    });
    
   
}; 
