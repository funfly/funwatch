//配置文件
var main = {
    port:3001,
    mongodb:{
        uri:'mongodb://funlfy:123456@192.168.9.64:27017/serverStatus',
        //uri:'mongodb://localhost:27017/serverStatus',
        options:{
            //db: { native_parser: true }, 
            server: { poolSize: 16 },
            //replset: { rs_name: 'myReplicaSetName' },
            user: 'funfly',
            pass: '123456'
        },
    },

};

module.exports = main;