# sprite-mind

基于 spritejs 基础脑图库

```js
import { SpriteMind } from 'sprite-mind'

let data = {
  text: '脑图测试',
  fixed: true,
  draggable: false,
  mouseEvents: {
    contextmenu: function(e) {
      this.attr('text', '测试')
    }
  },
  attrs: { color: '#fff', bgcolor: '#708fbf', border: null },
  children: [
    {
      text: '二级脑图1',
      children: [{ text: '三级脑图' }, { text: '三级脑图2' }, { text: '三级脑图3' }, { text: '三级脑图4' }, { text: '三级脑图5' }],
      expand: function(unfold, data) {
        console.log(unfold, data)
      }
    },
    { text: '二级脑图12', children: [{ text: '三级脑图' }, { text: '三级脑图2' }, { text: '三级脑图3' }, { text: '三级脑图4' }, { text: '三级脑图5' }] },
    { text: '二级脑图22222', children: [{ text: '三级脑图', children: [{ text: '三级脑图4' }] }, { text: '三级脑图2' }, { text: '三级脑图3' }] }
  ]
}
let spriteMind = new SpriteMind(
  {
    selector: '#app',
    animation: false,
    size: [800, 600]
  },
  data
)
window.oncontextmenu = function(e) {
  //取消默认的浏器自带右键 很重要！览！
  e.preventDefault()
}
console.log(spriteMind)
```

![sprite-mind](/mind.png)
