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