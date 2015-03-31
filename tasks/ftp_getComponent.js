/*
 * grunt-ftp-getComponent
 * https://github.com/JoyHo/grunt-ftp-getComponent
 *
 * Copyright (c) 2015 heyz
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  'use strict';

  grunt.util = grunt.util || grunt.utils;

  var async = grunt.util.async;
  var log = grunt.log;
  var file = grunt.file;
  var fs = require('fs');
  var path = require('path');
  var Ftp = require('jsftp');
  var prompt = require('prompt');

  var ftp;
  var localRoot;
  var remoteRoot;
  var currPath;
  var authVals;


  // A method for copy remote files
  function ftpGet(localhtmlsrc,localcsssrc,localjssrc,localimgsrc,remoteroot,done){

    var remotedir = remoteroot;
    var componentName = remotedir.substring(remotedir.lastIndexOf('/')+1);//获取组件名称
    var jsfile = [];
    var imgfile = [];

    /*********************插入html*************************/
    ftp.get(remotedir+'/index.html',function(err,data){
      if(err){
        return;
      }
      
      var str = data.toString();
      var strIndex = str.indexOf('<!--Component-->');
      var strLastIndex = str.lastIndexOf('<!--Component-->');
      if( strIndex >= 0){
        str = str.substring(strIndex+16,strLastIndex);
      }


      var readstr = grunt.file.read(localhtmlsrc);
      var targetIndex = readstr.indexOf('<!--Component-->');
      var newstr = '';
      if(targetIndex >= 0){
          newstr = readstr.substring(0,targetIndex+16)+'\n' + str +readstr.substring(targetIndex);
      }
      else{
        grunt.log.ok('not found');
      }

      grunt.file.write(localhtmlsrc,newstr);//要插入的本地目标html

    });
    /********************* end 插入html*************************/

    

    /***********************插入css   CSS以文件形式插入***********************/
      ftp.get(remotedir+'/css/style.css',function(err,data){
        if(err){
          return;
        }

        grunt.file.write(localcsssrc+componentName+'.css',data);//组件样式以独立文件形式存放

        /*下面插入向HTML文件插入CSS依赖*/
        var htmlcontent = grunt.file.read(localhtmlsrc),
        htmltemp = '';

        htmltemp = '<link href="'+localcsssrc+componentName+'.css"'+' rel="stylesheet"'+' type="text/css"'+' />';//插入CSS依赖

        //寻找html文件的head标签
        htmlcontent = htmlcontent.substring(0,htmlcontent.indexOf('</head>'))+'\n'+htmltemp+'\n'+htmlcontent.substring(htmlcontent.indexOf('</head>'));

        grunt.file.write(localhtmlsrc,htmlcontent);

      });
    /*********************** end 插入css***********************/



    /**************************插入JS  JS以文件形式插入**************************/

    ftp.ls(remotedir+'/js',function(err,res){
      if(err){
        return;
      }

      var htmlcontent = grunt.file.read(localhtmlsrc),
        htmltemp = '';

      //res是每个文件的基本信息，是数组类型，每个元素是一个object。很奇怪，数组的长度会比实际的文件数目多1

      for(var i=0,len=(res.length-1);i<len;i++){
        jsfile.push(res[i].name);
      }

      for(var i=0,len=jsfile.length;i<len;i++){

        +function(i){
            ftp.get(remotedir+'/js/'+jsfile[i],function(err,data){
              
              grunt.file.write(localjssrc+componentName+'/'+jsfile[i],data);
              //下面在html这种插入js依赖
              htmltemp += '<script src="'+localjssrc+componentName+'/'+jsfile[i]+'"></script>'+'\n';
              if(i==(len-1)){
                //寻找html文件的body结束标签
                var endbodyIndex = htmlcontent.indexOf('</body>');
                htmlcontent = htmlcontent.substring(0,endbodyIndex)+htmltemp+htmlcontent.substring(endbodyIndex);
                grunt.file.write(localhtmlsrc,htmlcontent);
              }
            });
        }(i);
              
      }



    });

    /************************** end 插入JS**************************/


    /***********************插入图片**************************/
    ftp.ls(remotedir+'/images/'+componentName,function(err,res){
      if(err){
        return;
      }

      for(var i=0,len=res.length;i<len;i++){
        if(i != (res.length-1)){
          imgfile.push(res[i].name);
        }
      }

      for(var i=0,len=imgfile.length;i<len;i++){
        +function(i){

            ftp.get(remotedir+'/images/'+componentName+'/'+imgfile[i],function(err,data){

              grunt.file.write(localimgsrc+componentName+'/'+imgfile[i],data);

              if(i == (len-1)){
                  //ftp断开链接
                  ftp.raw.quit(function(err,data) {
                      if (err) {
                        log.error(err);
                      } else {
                        log.ok(componentName+' download done!');
                      }
                      if(done){
                       done();
                      }
                       
                  });
              }

            });

        }(i);
      }

    });                                                                                                                                                   

  }


  function getAuthByKey(inKey) {
    var tmpStr;
    var retVal = {};

    if (fs.existsSync('.ftppass')) {
      tmpStr = grunt.file.read('.ftppass');
      if (inKey != null && tmpStr.length) retVal = JSON.parse(tmpStr)[inKey];
    }
    return retVal;
  }

  grunt.registerMultiTask('ftp_getComponent', 'get ftp component', function() {
    var done = this.async();

    // Init
    ftp = new Ftp({
      host: this.data.auth.host,
      port: this.data.auth.port
    });


    localRoot = Array.isArray(this.data.src) ? this.data.src[0] : this.data.src;
    remoteRoot = Array.isArray(this.data.dest) ? this.data.dest[0] : this.data.dest;
    authVals = this.data.auth.authKey ? getAuthByKey(this.data.auth.authKey) : getAuthByKey(this.data.auth.host);
    ftp.useList = true;


    var htmlsrc = this.data.src;//本地html文件
    var csssrc = this.data.cssdir;//本地CSS路径
    var jssrc = this.data.jsdir;//本地js路径
    var imgsrc = this.data.imgdir;//本地images路径


    // Getting all the necessary credentials before we proceed
    var needed = {
      properties: {}
    };

    if (!authVals.username) needed.properties.username = {};
    if (!authVals.password) needed.properties.password = {
      hidden: true
    };

    prompt.get(needed, function(err, result) {
      if (err) {
        grunt.warn('Authentication ' + err);
      }
      if (result.username) authVals.username = result.username;
      if (result.password) authVals.password = result.password;

      // Authentication and main processing of files
      ftp.auth(authVals.username, authVals.password, function(err) {
        if (err) {
          grunt.warn('Authentication ' + err);
        }

        ftpGet(htmlsrc,csssrc,jssrc,imgsrc,remoteRoot,done);

      });

      if (grunt.errors) {
        return false;
      }


    });

  });

};
