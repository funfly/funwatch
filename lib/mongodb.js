var config = require("../config/config");
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

exports.connect = function() {

    mongoose.connect(config.mongodb.uri,config.mongodb.options,function(err){
        if(err) throw err; 
        console.log("mongodb is ready")
    });

    var serverSchema = Schema({
        _id: {type:String,required:true,index:{unique:true}},    //IP地址
        systemtype: String, 
        release: String,
        totalmem: String,
        cpus: String,
        IFACE: String,
    },{versionKey:false})
    var servers = mongoose.model('servers', serverSchema);
    
    //CPU: TIME     CPU     %user     %nice   %system   %iowait    %steal     %idle
    var cpusSchema = Schema({
        time: {type:Number,index:true},  
        ip: {type:String, index:true},  
        cpu: String,
        user: String,
        nice: String,
        system: String,
        iowait: String,
        steal: String,
        idle: String,
    },{versionKey:false});
    
    var cpus = mongoose.model('cpus', cpusSchema);
    var cpu_alls = mongoose.model('cpu_alls', cpusSchema);
    
    //内存: TIME      kbmemfree kbmemused  %memused kbbuffers  kbcached  kbcommit   %commit
    //内存: TIME      kbmemfree kbmemused  %memused kbbuffers  kbcached kbswpfree kbswpused  %swpused  kbswpcad
    var memsSchema = Schema({
        time: {type:Number,index:true},  
        ip: {type:String, index:true},  
        kbmemfree: String,
        kbmemused: String,
        memused: String,
        kbbuffers: String,
        kbcached: String,
        kbswpfree: String,
        kbswpused: String,
        swpused: String,
        kbswpcad: String,
    },{versionKey:false});
    
    var mems = mongoose.model('mems', memsSchema);
    var mem_alls = mongoose.model('mem_alls', memsSchema);
    
    //IO: TIME      tps      rtps      wtps   bread/s   bwrtn/s
    var iosSchema = Schema({
        time: {type:Number,index:true},  
        ip: {type:String, index:true},  
        tps: String,
        rtps: String,
        wtps: String,
        bread: String,
        bwrtn: String,
    },{versionKey:false});
    
    var ios = mongoose.model('ios', iosSchema);
    var io_alls = mongoose.model('io_alls', iosSchema);
    
    //网络状态: TIME      IFACE   rxpck/s   txpck/s    rxkB/s    txkB/s   rxcmp/s   txcmp/s  rxmcst/s
    var netsSchema = Schema({
        time: {type:Number,index:true},  
        ip: {type:String, index:true},  
        IFACE: String,
        rxpck: String,
        txpck: String,
        rxkB: String,
        txkB: String,
        rxcmp: String,
        txcmp: String,
        rxmcst: String,
    },{versionKey:false});
    
    var nets = mongoose.model('nets', netsSchema);
    var net_alls = mongoose.model('net_alls', netsSchema);
    
    //进程队列长度和平均负载: TIME      runq-sz  plist-sz   ldavg-1   ldavg-5  ldavg-15
    var loadsSchema = Schema({
        time: {type:Number,index:true},  
        ip: {type:String, index:true},  
        runqSz: String,
        plistSz: String,
        ldavg1: String,
        ldavg5: String,
        ldavg15: String,
    },{versionKey:false});
    
    var loads = mongoose.model('loads', loadsSchema);
    var load_alls = mongoose.model('load_alls', loadsSchema);

}

exports.disconnect = function() {
    mongoose.disconnect();
}

exports.save = function(schema,data) {
    var model = mongoose.model(schema);
    var entity = new model();
    for(var k in data){
        entity[k] = data[k];
    }
    entity.save(function(err,doc){
        if (err) throw err;
    });
}
//删除文档 see: http://mongoosejs.com/docs/api.html#model_Model.remove
exports.remove = function(schema, conditions, callback) {
    mongoose.model(schema).remove(conditions, function(err,num){
        return callback(err,num);  
    });
}
//更新文档 see: http://mongoosejs.com/docs/api.html#model_Model.update
exports.update = function(schema, conditions, update, options, callback) {
    mongoose.model(schema).update(conditions, update, options, function(err,num){
        return callback(err,num);  
    });
}
//统计文档数 see: http://mongoosejs.com/docs/api.html#model_Model.count
exports.count = function(schema, conditions, callback) {
    mongoose.model(schema).count(conditions, function(err,doc){
        return callback(err,doc);  
    });
}
//查找不重复的文档 see: http://mongoosejs.com/docs/api.html#model_Model.distinct
exports.distinct = function(schema, field, conditions, callback) {
    mongoose.model(schema).distinct(field, conditions, function(err,doc){
        return callback(err,doc);  
    });
}
/* 查找文档 see: http://mongoosejs.com/docs/api.html#model_Model.find
 * 高级查找：
 * mongodb.find('topics',{_id:{$gte:19990,$lte:19995}},'_id uid post_ip',{sort:{_id:-1},skip:1,limit:3},function (err,doc) {
 *    //...
 * });
*/    
exports.find = function(schema, conditions, fields, options, callback) {
    mongoose.model(schema).find(conditions, fields, options, function(err,doc){
        return callback(err,doc);  
    });
}
//查找一条文档 see: http://mongoosejs.com/docs/api.html#model_Model.findOne
exports.findOne = function(schema, conditions, fields, options, callback) {
    mongoose.model(schema).findOne(conditions, fields, options, function(err,doc){
        return callback(err,doc);  
    });
}
//查找并删除一条文档 see: http://mongoosejs.com/docs/api.html#model_Model.findOneAndRemove
exports.findOneAndRemove = function(schema, conditions, options, callback) {
    mongoose.model(schema).findOneAndRemove(conditions, options, function(err,doc){
        return callback(err,doc);  
    });
}
//查找并更新一条文档 see: http://mongoosejs.com/docs/api.html#model_Model.findOneAndUpdate
exports.findOneAndUpdate = function(schema, conditions, update, options, callback) {
    mongoose.model(schema).findOneAndUpdate(conditions, update, options, function(err,doc){
        return callback(err,doc);  
    });
}
