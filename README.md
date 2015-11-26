# grunt-ftp-getComponent

这是一个 [grunt](https://github.com/gruntjs/grunt) 任务插件，用于从ftp下载选中的组件到对应页面中.

这个插件基于jsftp开发


## 开始

安装插件

```shell
npm install grunt-ftp-getComponent --save-dev
```

## 使用

在Gruntfile中的配置如下：

```javascript
'ftp_getComponent': {
      build:{
        auth:{
          host: '110.83.65.18',
          port: 23,
          authKey:'key1'
        },
        src: 'test.html',//组件html需要插入到的本地文件
        cssdir: 'css/',//本地CSS路径
        jsdir: 'js/',//js路径
        imgdir: 'images/',//本地图片路径
        dest: '/hehe/Scrollcomponent'//ftp上的组件文件夹,oomponent是组件名称
      }
    }
```

加载任务:

```javascript
grunt.loadNpmTasks('grunt-ftp-getComponent');
```


配置参数:

- **host** - ftp地址
- **port** - ftp地址使用的端口号
- **authKey** - 存放ftp用户名和密码信息的文件，该文件后缀名为.ftppass
- **src** - 组件html需要插入到的本地html文件
- **cssdir** - 组件css存放在本地的CSS路径，组件CSS独立成文件并且以组件名作为文件名
- **jsdir** - 组件js文件存放在本地的JS路径，组件JS存放在该路径下组件名文件夹中
- **imgdir** - 组件图片插入到本地的图片路径，组件图片存放在该路径下组件名文件夹中
- **dest** - ftp上的组件文件夹


## 认证参数

ftp用户名和密码都存放在一个命名为`.ftppass`的JSON文件中，这个文件必须存放在跟`Gruntfile`文件同一目录下。`.ftppass`文件格式如下：

```javascript
{
  "key1": {
    "username": "username1",
    "password": "password1"
  },
  "key2": {
    "username": "username2",
    "password": "password2"
  }
}
```


