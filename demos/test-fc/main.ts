import {
    unstable_ImmediatePriority as ImmediatePriority, // 同步优先级
    unstable_UserBlockingPriority as UserBlockingPriority, // 交互，比如点击事件
    unstable_NormalPriority as NormalPriority, // 正常优先级
    unstable_LowPriority as LowPriority, // 更低优先级
    unstable_IdlePriority as IdlePriority,
    unstable_scheduleCallback as scheduleCallback,
    unstable_shouldYield as shouldYield,
    CallbackNode,
    unstable_getFirstCallbackNode as getFirstCallbackNode,
    unstable_cancelCallback as cancelCallback
} from 'scheduler'

const root = document.querySelector("#root");

type Priority =
    | typeof ImmediatePriority
    | typeof UserBlockingPriority
    | typeof NormalPriority
    | typeof LowPriority
    | typeof IdlePriority;

interface Work {
    count: number,
    priority: Priority
}

const workList: Array<Work> = [];
let prevPriority: Priority = IdlePriority;
let curCallback: CallbackNode | null = null;


[LowPriority, NormalPriority, UserBlockingPriority, ImmediatePriority].forEach(priority => {
    const btn = document.createElement("button");
    root?.appendChild(btn);
    btn.innerText = [
        '',
        'ImmediatePriority',
        'UserBlockingPriority',
        'NormalPriority',
        'LowPriority'
    ][priority]
    btn.onclick = () => {
        workList.push({
            count: 100,
            priority: priority as Priority
        });
        schedule();
    }
})

function schedule() {

    const cbNode = getFirstCallbackNode(); // 当前第一个调度的回调
    // 优先级最高的work
    const curWork = workList.sort((w1, w2) => w1.priority - w2.priority)[0];

    if (!curWork) {
        curCallback = null;
        if (cbNode) {
            // worklist操作完，取消之前的调度
            cancelCallback(cbNode);
            return;
        }
    }

    const { priority: curPriority } = curWork;
    if (curPriority === prevPriority) { // 优先级相同，不需要开启新的调度
        return;
    }
    // 更高优先级的work
    cbNode && cancelCallback(cbNode);

    // 当前scheduleCallback调度返回的回调函数 // 红任务
    curCallback = scheduleCallback(curPriority, perform.bind(null, curWork));

}

function perform(work: Work, didTimeout?: Boolean) {
    // 1. work为ImmediatePriority，同步优先级不可中断
    // 2. 饥饿问题，work一直得不到执行，优先级会越来越高，直到过期后就立即执行
    // 3. 时间切片 当前时间切片用完了，停下来，让浏览器渲染，下次有时间继续执行

    const needSync = work.priority === ImmediatePriority || didTimeout;

    // 需要同步执行或者时间切片没有用完  同时count不为0，就继续执行
    while ((needSync || !shouldYield()) && work.count) {
        work.count--;
        insertSpan(work.priority+'');
    }

    // 中断执行 || 执行完 

    // 当前工作的work的priority
    prevPriority = work.priority;
    if (!work.count) { // 执行完
        const workIndex = workList.indexOf(work);
        workList.splice(workIndex, 1);
        // 重置
        prevPriority = IdlePriority;
    }


    const prevCallback = curCallback;
    schedule();
    const newCallback = curCallback;

    if (newCallback && prevCallback === newCallback) {
        //优化策略
        return perform.bind(null, work)
    }

}


function insertSpan(content: string) {
    const span = document.createElement("span");
    span.innerText = content;
    span.className = `pri-${content}`
    doSomeBuzyWokr(10000000)
    root?.appendChild(span)
}


function doSomeBuzyWokr(len: number) {
    let result = 0;
    while (len--) {
        result += len;
    }
}