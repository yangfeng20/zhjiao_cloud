// ==UserScript==
// @name         职教云|智慧职教助手[稳定版]
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  智慧职教自动刷课，点击进入课程首页自动开始（播放视频第一次手动静音），可结合浏览器倍数插件一起使用（最好别超过1.5倍速）
// @author       maple
// @match        https://zjy2.icve.com.cn/study/process/process.html*
// @match        https://zjy2.icve.com.cn/common/directory/directory.html*
// @icon         https://zjy2.icve.com.cn/common/images/logo.png
// @grant        none
// ==/UserScript==
////////课程首页参数///////////
//需要排除内容的列表
let exclude_array = [
    '自己添加需要过滤的内容名称，按照脚本说明来',
];

//未完成的模块数组
let undoneModule = [];

//结束变量
let stop;

//包含章节的tr列表长度
let trList_len;

//模块下所有内容的数量
let contentList_num;

//模块指针
point = 0;

//是否下一个模块
let next = false;

//排除次数
let excludeNum = 0;


///////学习页面参数///////////

//判断视频内容的次数
let judgeCount = 0;

//判断内容结束条件
let judgeStop;


//用于判断是否为视频的变量【其他页面也有】
let play;

//学习内容的类型
let contentType="";

//学习是否结束
let study_end = false;



////////////////////////////////////////////////【begin】////////////////////////////////////////////////////////////

//课程首页的网址
let url = 'https://zjy2.icve.com.cn/study/process/process.html?'

//判断是课程首页还是学习页面
if (document.URL.indexOf(url)!==-1) {
    //课程首页
    console.log("dir-begin");
    stop = setInterval(main, 2000);
}else {
    //学习页面开始
    console.log("study-begin")
    judgeStop = setInterval(studyMain, 2000);
}


///////////////////////////////////////////////课程首页//////////////////////////////////////////


//课程首页主函数
function main() {

    //首页加载超时处理
    exeTimeout();

    try{
        //数组中有数据就不需要获取数组
        if (undoneModule.length===0){
            findUndoneModule();
        }

        console.log("当前模块索引："+point)
        openModule(undoneModule[point]);
        openSection(undoneModule[point]);
        clickContent(undoneModule[point]);
    }catch (e) {
        console.log("错误信息："+e);
        //stop = setInterval(main, 5000);
    }

    next_module();
}

//找到所有未完成模块
function findUndoneModule() {
    //包含所有模块的div(里面还有别的标签)
    let div = document.getElementById("process_container");
    //过滤之后的所有模块[列表]
    let moduleList = div.getElementsByClassName("moduleList");

    //遍历模块数组
    for (let i = 0; i < moduleList.length; i++) {
        //找到每个模块的进度div
        let schedule = moduleList[i].getElementsByTagName("div")[2];
        //进度不为100%就添加到未完成
        if (" 100% " !== schedule.innerHTML){
            //添加未完成模块到数组
            undoneModule.push(moduleList[i]);
        }
    }
    console.log("所有模块数组：")
    console.log(undoneModule);

}

//展开模块
function openModule(m1) {
    //模块展开状态
    let status = m1.getElementsByClassName("topic_container")[0].style.display;

    //状态不可见，展开模块
    if ("block"!==status){
        //点击模块的三角箭头，【展开模块目录】
        m1.getElementsByTagName("span")[1].click();
    }
}

//展开模块下的章节
function openSection(m) {
    //包含模块下所有章节的div
    let div = m.getElementsByClassName("topic_container")[0];
    //包含章节的tr列表
    let trList = div.getElementsByTagName("tr");

    //等待才能获取到tr列表的长度
    if (trList_len===undefined || trList_len===0){
        trList_len = trList.length;
    }
    console.log("trList长度："+trList_len)    //为零就等待下一次获取【为2表示这个是空模块】

    //前面有3个无效tr，不是章节（从索引为3的开始取）
    for (let i = 2; i < trList.length; i++) {
        if (i%2===1){
            //这个里面所有的都是有效章节 每一个为trList[i]
            //未打开才展开【未展开是有这个元素】
            let openStatus = m.getElementsByClassName("am-icon sh-toc-expand  topic_condensation am-icon-caret-right")[0];
            if (openStatus!==undefined){
                trList[i].click();          //展开模块中的每一个章节
            }
            //console.log(trList[i])
        }
    }

    //trList=2时表示这个模块为空【未获取到数据trList=0】
    if (trList_len===2){
        //开始下一个模块
        next=true;
    }


}


//点击章节中的内容（ppt，视频...）
function clickContent(m) {
    //包含所有内容的div [一个模块下所有的，不含不同章节的内容]
    let contentDiv = m.getElementsByClassName("sh-toc-list");
    if (contentList_num===undefined || contentList_num===0){
        contentList_num = contentDiv.length;
    }else {
        console.log("div长度：:"+contentList_num);
        //clearInterval(stop)
    }
    for (let i = 0; i < contentList_num; i++) {
        let contentList = contentDiv[i];    //模块中某一个章节的所有内容

        //console.log(contentList);         //如果输出的内容下没有子标签，那么这个章节中没有内容（直接下一个模块）

        //判断章节是否为空 [空返回true]
        if (isEmptySection(contentList) && point===0){
            next = true;
            continue;
        }

        //一个章节中的所有模块
        let contentS = contentList.getElementsByClassName("sh-res-h am-margin-top-xs");
        //console.log(contentS)
        for (let j = 0; j < contentS.length; j++) {
            //最小单位 内容
            let content = contentS[j];
            //console.log(content)

            //有a标签才是内容，不然有可能是文件夹
            if (content.getElementsByTagName("a").length!==0){

                //内容中的span标签，用来获取这个内容的进度
                let span = content.getElementsByTagName("span")[0];

                //学习进度不是100%就点击
                if (span.title!=="100%" && span.title!==undefined && span.title!==""){
                    //console.log("未完成：")
                    //console.log("学习进度："+span.title);
                    //console.log(content);

                    //排除异常的内容（数组中的自定义）
                    exclude(content);
                }else if (i===contentS.length-1 && span.title ==="100%"){
                    //模块中的所有内容都已完成 【只是模块进度还没刷新，打开了这个模块】
                    next = true;    //下一个模块

                }



            }
        }
    }


}

//判断一个章节是否为空
function isEmptySection(contentList) {
    //子节点个数（为1就是章节为空[有一个text子标签]）
    let childNodeNum = contentList.childNodes.length;
    //console.log("子节点的个数："+childNodeNum);
    return childNodeNum <= 1;
}


//排除异常的内容(并点击)
function exclude(content) {
    //内容下包含[标题]的a标签（取出innerHtml就是title）
    let title = content.getElementsByTagName("a")[0].innerHTML;

    //包含在数组中的就排除
    if (exclude_array.indexOf(title)>=0){
        console.log("排除的内容title: "+title);
        //开始下一个模块
        if (excludeNum>=10){
            next = true;
        }
        excludeNum++;
        return;
    }

    console.log('------------')
    console.log("未完成内容：点击观看 "+title)
    console.log('------------')


    //不包含就点击,并结束下面的
    content.click();
    next = true;
    clearInterval(stop);
}



//如果上面结束了，开始下一个模块
function next_module() {
    if (next){
        point++;
        //重置
        trList_len = undefined;
        contentList_num = undefined;
        next = false;
    }
    //停止
    if (point>=30){
        clearInterval(stop);
        //刷新浏览器
        location.reload();
    }
}

//课程首页页面的超时提示
function exeTimeout() {
    //弹窗
    let popup = document.getElementsByClassName("popBox")[0];
    //弹窗存在
    if (popup){
        console.log("超时弹窗")
        //确定按钮
        let button = popup.getElementsByClassName("sgBtn ok")[0];
        button.click();
        //刷新浏览器
        location.reload();
    }
}



///////////////////////////////////////////////学习页面///////////////////////////////////////////////

//学习页面主函数
function studyMain(){
    //处理上一次学习记录弹窗
    hint();
    //判断学习内容类型
    judgeType();
    //控制器【不同类型执行不同操作】
    controller();
}

//处理提示[上次学习与这次学习]
function hint(){
    let link = document.getElementsByClassName("link");
    if (link.length===0){
        //没有弹出提示
        return;
    }
    //不会在控制台显示，因为点击之后会刷新浏览器
    console.log("上一次学习记录【已处理】");

    //【弹出提示】点击本次的学习记录
    link[1].getElementsByTagName("a")[0].click();
}

//判断当前学习的内容类型 【都需要第二次才能获取到】
function judgeType() {

    //执行一次判断【自增】
    judgeCount++;

    //文档   【正常】
    let doc = document.getElementsByClassName("swiper-pagination-total")[0];
    if(doc){
        // console.log("文档")
        // console.log(doc);
        contentType = "文档";
    }

    //ppt[动态]  【正常】
    let ppt = document.getElementsByClassName("stage-next-btn")[0];
    if(ppt){
        // console.log("ppt[动态]")
        // console.log(ppt);
        contentType = "ppt[动态]";
    }

    //ppt[静态] 【正常】
    let pt = document.getElementsByClassName("MPreview-pageCount")[0];
    if(pt){
        //获取到之后输出
        // console.log("ppt[静态]");
        // console.log(pt)
        contentType = "ppt[静态]";
    }


    //视频【这个其他页面也有，主要是用来获取后面的节点】  【正常】
    if (!play){
        play = document.getElementById("docPlay");
    }
    //下面有内容才是继续
    if(play.innerHTML!==""){
        //play中有这个类的标签就是视频
        let set = play.getElementsByClassName("jw-media jw-reset")[0];
        if(set){
            // console.log("视频")
            // console.log(set);
            contentType = "视频";
        }
    }

    //判断学习内容【只判断3次】
    if (judgeCount>=3){
        clearInterval(judgeStop)
    }
}


//控制器
function controller(){
    if(contentType!==""){
        //输出学习内容类型并结束获取
        console.log(contentType);
        clearInterval(judgeStop);

        //相应的内容做对应的操作
        sWitch(contentType);
        return;
    }

    //3次之后还未获取到 [重复获取]
    if(contentType==="" && judgeCount===3){
        console.log("未获取到学习内容类型");
        judgeStop = setInterval(studyMain, 4000);

    }
}


//执行相应的处理操作
function sWitch(type){
    switch(type){
        case      "文档": exeDoc();break;
        case "ppt[动态]": exePpt();break;
        case "ppt[静态]": exePt();break;
        case      "视频": exeVideo();break;
    }
}


//处理文档
function exeDoc(){
    //当前图片页数
    let current = document.getElementsByClassName("swiper-pagination-current")[0].innerHTML;

    //所有图片页数
    let all = document.getElementsByClassName("swiper-pagination-total")[0].innerHTML;

    //点击次数【可能存在延迟，多点击2次】
    let count = all-current+3;

    console.log("点击次数："+count);
    let docStop = setInterval(loop,1500);


    function loop(){
        // 学习异常处理
        except();

        if(count!==0){
            //下一张按钮 [可能需要等待]
            let button = document.getElementsByClassName("swiper-button-next")[0];
            button.click();
            count--;
        } else{
            //为零[点击完毕退出]
            clearInterval(docStop);
            //内容学习完毕
            study_end = true;
            console.log("结束");
            //回到首页
            back();
        }
    }



}

//处理ppt[动态]
function exePpt(){

    //新页的数值
    let new_pag = "xxx";
    //结束条件
    let pptStop = setInterval(loop, 2000);
    //一张ppt的动态计数 【最大值20】
    let count = 0;

    function loop(){
        // 学习异常处理
        except();
        //新页面的数值还在变化
        if (new_pag!==getNum()){
            //上一次和这一次的页数不一致【点击下一张，并】
            new_pag = getNum();
            //图片下一张按钮[点击]
            let button = document.getElementsByClassName("stage-next-btn")[0];
            button.click();
            console.log("静态点击");

            //如果有了新的ppt页执行，动态计数清零
            count=0;
        }else{

            console.log("动态计数："+count)
            count++;
            //如果指定次数还没有新页，则认定结束
            if (count===20){
                clearInterval(pptStop);
                console.log("结束");
                //内容学习完毕
                study_end = true;
                //回到首页
                back();
                //结束
                return;
            }

            //稍微延时之后点击一个ppt图片中的动态效果
            sleep(50).then(() => {
                //先点击下一张
                let button = document.getElementsByClassName("stage-next-btn")[0];
                button.click();

                //没有变化，可能是到了动态的ppt，也有可能是结束了
                loop();
            })
        }

    }

    function getNum(){
        //新的ppt数量【随点击而变化，不变化了就说明没有新的图片了，结束了】
        new_pag = $("input[name='newlyPicNum']").val();
        return new_pag;
    }

}

//处理ppt[静态]
function exePt(){
    let new_pag_num = 'xxx';
    let ptStop = setInterval(loop,1500);

    function loop() {
        // 学习异常处理
        except();
        //页数还在变化执行
        if(new_pag_num!==getNum()){
            //重新获取
            new_pag_num = getNum();
            //下一张按钮 [这是个侧边按钮（如果是文档走了这里，就没有侧边按钮）]
            //let button = document.getElementsByClassName("MPreview-arrowBottom")[0];

            // 下一张按钮，下方按钮【类似ppt的文档也能使用】
            let button = document.getElementsByClassName("MPreview-pageNext current")[0];
            if (button){
                button.click();
            }


        } else{
            //这一次和上一次相同了，结束
            clearInterval(ptStop);
            //内容学习完毕
            study_end = true;
            //回到首页
            back();
            console.log("结束");
        }
    }

    function getNum(){
        //新的ppt数量【随点击而变化，不变化了就说明没有新的图片了，结束了】
        new_pag_num = $("input[name='newlyPicNum']").val();
        return new_pag_num;
    }


}

//处理视频
function exeVideo(){
    //视频进度
    let schedule = "xx";
    //视频停止计数
    let count = 0;
    let videoStop = setInterval(loop, 2000);

    function loop(){
        // 学习异常处理
        except();
        //视频进度到达100%就退出
        if (schedule==="100%"){
            //结束
            console.log("结束")
            clearInterval(videoStop);
            //内容学习完毕
            study_end = true;
            //回到首页
            back();
            return;
        }else if (schedule===getSchedule()){
            //当前进进度和上一次的进度是否一样
            if (count===10){
                //重复10次进度一直，刷新浏览器
                location.reload();   //【可能无效，刷新之后还是为播放】
            }
            //视频停止计数
            count++;
        }else{
            //没有停止【计数清零】
            count=0;
        }
        //获取进度
        schedule = getSchedule();
        console.log("视频进度："+getSchedule());
    }

}

//获取视频进度
function getSchedule(){
    try {
        let bar = document.querySelector(".jw-progress");
        return bar.style.width;
    }catch (e){
        return "error";
    }
}

//学习异常弹窗
function except(){
    //找到异常按钮a标签
    let a = document.getElementsByClassName("sgBtn ok")[0];
    //异常按钮存在就点击
    if (a !== undefined && a !== null){
        console.log("学习异常【已处理】")
        console.log(a);
        a.click();
    }else{
        //console.log("无异常")
    }
}


//学习完毕，返回首页
function back() {
    //是否学习结束
    if (study_end){
        //返回按钮
        let back = document.getElementsByClassName("np-menu-nav-li")[0];
        //延迟两秒之后返回首页
        sleep(2000).then(() => {
            back.getElementsByTagName("a")[0].click();
        })
    }
}


//延时函数
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
