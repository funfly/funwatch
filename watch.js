/**
 * funWatch Linux服务器监控系统v1.0
 *   基于sysstat + nodejs + mongoosejs(mongodb) + expressjs + ejs
 *   默认每5秒钟收集1次数据
 *   默认每5分钟保存一次数据
 *
 * mongodb 集合：
 *   服务器列表：servers
 *   每5分钟内的平均值：cpus mems ios nets loads 
 *   每5秒钟采集的原始数据：cpu_alls mem_alls io_alls net_alls load_alls
 *
 * 运行：node watch.js [period] [internal]
 *       node watch.js 1 2 //每2秒收集一次数据，每分钟保存一次数据
 * 
 * 运行报表server：node app.js
 * 浏览器访问：http://localhost:3001/
 *
 * 作者：funfly 
 * 博客：www.funfly.cn
 * 邮箱：echo@funfly.cn
 */
var os  = require('os');
var fs  = require('fs');
var exec = require('child_process').exec;
var config = require("./config/config");
var mongodb = require("./lib/mongodb");
    //连接mongodb
    mongodb.connect();
    
var period = 60*5;                       //数据采集总时长(s)；请以5分钟为最小采集单位
var internal = 5;                        //数据采集时间间隔(s)；此处设置5秒采集1次数据

if('undefined' != typeof(process.argv[2]) && parseInt(process.argv[2])){
    period = parseInt(process.argv[2])*60;
}

if('undefined' != typeof(process.argv[3]) && parseInt(process.argv[3])){
    internal = parseInt(process.argv[3]);
}

var count = parseInt(period/internal);   //计算5分钟内需要数据采集的次数；

var myTime = function(type){    
    var now = new Date();
    if('int' == type){
        return parseInt(now.getTime()/1000);
    }
    return now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate()+' '+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds(); 
};

var trim = function(s){
    s = s.replace('AM','');
    s = s.replace('PM','');
    s = s.replace(/\s+/g,' ');
    return s;
};

var status_info = {
        'ip'         : 'localhost',
        'systemtype' : os.type(),
        'release'    : os.release(),
        'totalmem'   : parseInt(os.totalmem()/1024),
        'cpus'       : os.cpus().length,
    };

//IP: /sbin/ifconfig | grep 'inet addr:' | grep -v '127.0.0.1' | cut -d : -f2 | awk '{print $1}'
exec("/sbin/ifconfig | grep 'inet addr:' | grep -v '127.0.0.1' | cut -d : -f2 | awk '{print $1}'",
  function (error, stdout, stderr) {
    if (error !== null) {
        console.log('exec error: ' + error);
    }else{
        status_info.ip = stdout.replace('\n','');
        
        //获取网络接口
        exec('sar -n DEV 1 1',
          function (error, stdout, stderr) {
            if (error !== null) {
               console.log('exec error: ' + error);
            }else{
               var data = new Array;
               stdout = stdout.split('\n');
               var k=0;
               
               for(var i in stdout){
                  if(stdout[i].length && stdout[i].indexOf('Linux') == -1 &&  stdout[i].indexOf('rxmcst') == -1 &&  stdout[i].indexOf('Average:') == -1){
                      var tmp = trim(stdout[i]).split(' ');
                      data[k] = tmp[1];
                      k++;
                  }
               }
                
                var serverData = {
                    _id:status_info.ip,
                    systemtype: status_info.systemtype, 
                    release: status_info.release,
                    totalmem: status_info.totalmem,
                    cpus: status_info.cpus,
                    IFACE:JSON.stringify(data)
                }

                mongodb.findOne('servers',{_id:status_info.ip},function(err,doc){
                    if(err) throw err;
                    if(!doc){
                        mongodb.save('servers',serverData);
                        console.log('Server info has saved !');
                    }
                });
            }
        });
        
    }
});

var store = function(type,data,startTime){
    var statusData = {}
        statusData.ip = status_info.ip;

        var status_file = "/home/funfly/"+type+".txt"; 
        var status_data = JSON.stringify(data);
        fs.writeFile(status_file,status_data,function(){});
        
    if('cpu' == type){
        for(var k in data){
            statusData.time = startTime+internal*(parseInt(k)+1);
            statusData.cpu = data[k][1];
            statusData.user = data[k][2];
            statusData.nice = data[k][3];
            statusData.system = data[k][4];
            statusData.iowait = data[k][5];
            statusData.steal = data[k][6];
            statusData.idle = data[k][7];
            if('Average:' != data[k][0]){
                statusData.time = myTime('int');
                mongodb.save('cpu_alls',statusData);
            }else{
                mongodb.save('cpus',statusData);
            }
        }
        console.log('start time : '+startTime+'; CpuStatus has saved !');
    }else if('mem' == type){
        for(var k in data){
            statusData.time = startTime+internal*(parseInt(k)+1);
            statusData.kbmemfree = data[k][1];
            statusData.kbmemused = data[k][2];
            statusData.memused = data[k][3];
            statusData.kbbuffers = data[k][4];
            statusData.kbcached = data[k][5];
            statusData.kbswpfree = data[k][6];
            statusData.kbswpused = data[k][7];
            statusData.swpused = data[k][8];
            statusData.kbswpcad = data[k][9];
            if('Average:' != data[k][0]){
                statusData.time = myTime('int');
                mongodb.save('mem_alls',statusData);
            }else{
                mongodb.save('mems',statusData);
            }
        }
        console.log('start time : '+startTime+'; MemStatus has saved !');
    }else if('io' == type){
        for(var k in data){
            statusData.time = startTime+internal*(parseInt(k)+1);
            statusData.tps = data[k][1];
            statusData.rtps = data[k][2];
            statusData.wtps = data[k][3];
            statusData.bread = data[k][4];
            statusData.bwrtn = data[k][5];
            if('Average:' != data[k][0]){
                statusData.time = myTime('int');
                mongodb.save('io_alls',statusData);
            }else{
                mongodb.save('ios',statusData);
            }
        }
        console.log('start time : '+startTime+'; IoStatus has saved !');
    }else if('net' == type){
        for(var k in data){
            statusData.time = startTime+internal*(parseInt(k)+1);
            statusData.IFACE = data[k][1];
            statusData.rxpck = data[k][2];
            statusData.txpck = data[k][3];
            statusData.rxkB = data[k][4];
            statusData.txkB = data[k][5];
            statusData.rxcmp = data[k][6];
            statusData.txcmp = data[k][7];
            statusData.rxmcst = data[k][8];
            if('Average:' != data[k][0]){
                statusData.time = myTime('int');
                mongodb.save('net_alls',statusData);
            }else{
                mongodb.save('nets',statusData);
            }
        }
        console.log('start time : '+startTime+'; NetStatus has saved !');
    }else if('load' == type){
        for(var k in data){
            statusData.time = startTime+internal*(parseInt(k)+1);
            statusData.runqSz = data[k][1];
            statusData.plistSz = data[k][2];
            statusData.ldavg1 = data[k][3];
            statusData.ldavg5 = data[k][4];
            statusData.ldavg15 = data[k][5];
            if('Average:' != data[k][0]){
                statusData.time = myTime('int');
                mongodb.save('load_alls',statusData);
            }else{
                mongodb.save('loads',statusData);
            }
        }
        console.log('start time : '+startTime+'; LoadavgStatus has saved !');
    }
};

var watchNow = function(){
    var startTime = myTime('int');
    
    //CPU: TIME     CPU     %user     %nice   %system   %iowait    %steal     %idle
    exec('sar -u '+internal+' '+count,
      function (error, stdout, stderr) {
        if (error !== null) {
           console.log('exec error: ' + error);
        }else{
           var data = new Array;
           stdout = stdout.split('\n');
           var k=0;
           for(var i in stdout){
              if(stdout[i].length && stdout[i].indexOf('Linux') == -1 &&  stdout[i].indexOf('idle') == -1){
                  data[k] = trim(stdout[i]).split(' ');
                  k++;
              }
           }
           store('cpu',data,startTime);
        }
    });

    //内存(sysstat version 9.0.4): TIME      kbmemfree kbmemused  %memused kbbuffers  kbcached  kbcommit   %commit 
    //内存(sysstat version xxxxx): TIME      kbmemfree kbmemused  %memused kbbuffers  kbcached kbswpfree kbswpused  %swpused  kbswpcad
    exec('sar -r '+internal+' '+count,
      function (error, stdout, stderr) {
        if (error !== null) {
           console.log('exec error: ' + error);
        }else{
           var data = new Array;
           stdout = stdout.split('\n');
           var k=0;
           for(var i in stdout){
              if(stdout[i].length && stdout[i].indexOf('Linux') == -1 &&  stdout[i].indexOf('kbmemfree') == -1){
                  data[k] = trim(stdout[i]).split(' ');
                  k++;
              }
           }
           store('mem',data,startTime);
        }
    });
    
    //IO: TIME      tps      rtps      wtps   bread/s   bwrtn/s
    exec('sar -b '+internal+' '+count,
      function (error, stdout, stderr) {
        if (error !== null) {
           console.log('exec error: ' + error);
        }else{
           var data = new Array;
           stdout = stdout.split('\n');
           var k=0;
           for(var i in stdout){
              if(stdout[i].length && stdout[i].indexOf('Linux') == -1 &&  stdout[i].indexOf('bwrtn') == -1){
                  data[k] = trim(stdout[i]).split(' ');
                  k++;
              }
           }
           store('io',data,startTime);
        }
    });
    
    //网络状态: TIME      IFACE   rxpck/s   txpck/s    rxkB/s    txkB/s   rxcmp/s   txcmp/s  rxmcst/s
    exec('sar -n DEV '+internal+' '+count,
      function (error, stdout, stderr) {
        if (error !== null) {
           console.log('exec error: ' + error);
        }else{
           var data = new Array;
           stdout = stdout.split('\n');
           var k=0;
           for(var i in stdout){
              if(stdout[i].length && stdout[i].indexOf('Linux') == -1 &&  stdout[i].indexOf('rxmcst') == -1){
                  data[k] = trim(stdout[i]).split(' ');
                  k++;
              }
           }
           store('net',data,startTime);
        }
    });
    
    //进程队列长度和平均负载: TIME      runq-sz  plist-sz   ldavg-1   ldavg-5  ldavg-15
    exec('sar -q '+internal+' '+count,
      function (error, stdout, stderr) {
        if (error !== null) {
           console.log('exec error: ' + error);
        }else{
           var data = new Array;
           stdout = stdout.split('\n');
           var k=0;
           for(var i in stdout){
              if(stdout[i].length && stdout[i].indexOf('Linux') == -1 &&  stdout[i].indexOf('ldavg') == -1){
                  data[k] = trim(stdout[i]).split(' ');
                  k++;
              }
           }
           store('load',data,startTime);
        }
    });

};

watchNow();

setInterval(function(){
    watchNow();
},period*1000);