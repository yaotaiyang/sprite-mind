import { Node, Stage, Link } from 'sprite-nodes-links/src/index'
import { Label, Polycurve, Group, Circle } from 'spritejs'
import { extendsObject } from './utils'
import filterClone from 'filter-clone'
class SpriteMind extends Stage {
  constructor(option, data) {
    super(option)
    if (data) {
      let nodeAttrs = filterClone(data)
      let mergeAttrs = extendsObject({ level: 0, pos: [option.size[0] / 2, option.size[1] / 2] }, nodeAttrs)
      let mainNode = new MindNode(mergeAttrs)
      mainNode.children = []
      let nodeTree = { node: mainNode, attrs: nodeAttrs, children: mainNode.children, level: 0 }
      this.append(mainNode)
      mainNode.data = nodeTree
      if (data.children) {
        addNode.bind(this)(mainNode, data.children, nodeTree.children)
      }
      this.layout()
      super.checkForceLink(option.animation)
    }
  }
  layout() {
    let levels = []
    let stageHeight = this.attr('size')[1]
    this.nodes.forEach(item => {
      let level = item.attr('level')
      levels[level] = levels[level] || []
      levels[level].push(item)
    })
    levels.forEach((arr, level) => {
      if (level === 0) {
        let node = arr[0]
        arr.width = node.sizeBox[2] - node.sizeBox[0]
        let pos = node.attr('pos')
        pos = [arr.width, pos[1]]
        node.attr({ pos })
        arr.pos = pos
      } else {
        let { pos: pPos, width: pWidth } = levels[level - 1]
        arr.width = 0
        arr.forEach(node => {
          let curWidth = node.sizeBox[2] - node.sizeBox[0]
          arr.width = curWidth > arr.width ? curWidth : arr.width
        })
        let targetX = pPos[0] + pWidth / 2 + arr.width / 2 + 20 * level
        let pY = pPos[1]
        let centerNum = (arr.length - 1) / 2
        let perNum = stageHeight / (arr.length + 1)
        perNum = Math.max(perNum, 60)
        arr.forEach((node, yi) => {
          let targetY = pY + perNum * (yi - centerNum)
          let pos = [targetX, targetY]
          node.attr({ pos })
          node.reSize()
        })
        arr.pos = [targetX, pPos[1]]
      }
    })
  }
}
class MindNode extends Node {
  constructor(attrs) {
    let mergeAttrs = extendsObject({ showChildren: true, forceAxis: 'y', forceLink: [0.8, 1], draggable: false }, attrs)
    super(mergeAttrs)
    let mouseEvents = attrs.mouseEvents
    if (mouseEvents) {
      for (let key in mouseEvents) {
        this.on(key, mouseEvents[key])
      }
    }
  }
  draw() {
    let { text, level, attrs } = this.attr()
    let label = new Label(text)
    let circle = new Circle()
    circle.attr({
      radius: 4,
      fillColor: '#6797b7',
      strokeColor: 'transparent',
      lineWidth: 0
    })
    let fontSize = 24 - level * 4
    fontSize = fontSize > 12 ? fontSize : 12
    label.attr(
      extendsObject(
        {
          padding: [6, 16, 4, 16],
          bgcolor: '#ebf1f5',
          border: [1, '#6797b7'],
          borderRadius: [4],
          fontSize: fontSize > 12 ? fontSize : 12,
          anchor: [0.5, 0.5]
        },
        attrs
      )
    )
    this.$label = label
    this.$dot = circle
    let children = this.attr('children')
    this.append(label)
    this.append(circle)
    circle.on('click', _ => {
      let showChildren = this.attr('showChildren')
      this.attr('showChildren', !showChildren)
      let expand = this.data.attrs.expand
      if (expand && typeof expand === 'function') {
        expand.call(this, !showChildren, this.data)
      }
    })
    if (children && children.length) {
      circle.attr({ display: '' })
    } else {
      circle.attr({ display: 'none' })
    }
  }
  reSize() {
    super.reSize()
    let sizeBox = this.getSizeBox()
    if (this.$dot) {
      this.$dot.attr({ pos: [(sizeBox[2] - sizeBox[0]) / 2, 0], anchor: [1, 0.5], translate: [2, 0] })
    }
  }
  getSizeBox() {
    let sizeBox = this.sizeBox
    if (this.$label) {
      sizeBox = this.$label.renderBox
    }
    return sizeBox
  }
  attr(name, val) {
    let res = super.attr(name, val)
    if (this.$label && name === 'text') {
      this.$label.attr({ text: val })
      this.$label.__changeText = true
      let me = this
      this.$label.on('afterdraw', e => {
        if (this.$label.__changeText) {
          super.reSize()
          this.reSize()
          this.moveLink()
          delete me.$label.__changeText
        }
      })
    }
    if (name === 'showChildren') {
      if (val === true || val === false) {
        this.showChildren(val)
      }
    }
    return res
  }
  showChildren(show) {
    let children = this.data.children
    let ids = []
    let display = show ? '' : 'none'
    showChild(display, children, ids)
    let links = this.stage.links
    links.forEach(link => {
      let { startId, endId } = link.__attrs
      if (ids.indexOf(startId) !== -1 || ids.indexOf(endId) !== -1) {
        link.container.attr({ display })
      }
    })
    function showChild(display, children, ids) {
      children.forEach(child => {
        child.node.container.attr({ display })
        ids.push(child.node.__attrs.id)
        if (child.children && children.length) {
          showChild(display, child.children, ids)
        }
      })
    }
  }
}
class MindLink extends Link {
  constructor(attrs) {
    super(attrs)
  }
  draw() {
    this.$line = new Polycurve()
    //创建group用来纠正path偏移
    this.wrap = new Group({ size: [0.1, 0.1], clipOverflow: false })
    this.$line.attr({ strokeColor: '#6797b7' })
    this.wrap.append(this.$line)
    this.append(this.wrap)
  }
  mounted() {
    this.move()
  }
  move() {
    let { startId, endId } = this.attr()
    let stageHeight = this.stage.attr('size')[1]
    let startNode = this.stage.nodes.filter(node => node.attr('id') === startId)[0]
    let endNode = this.stage.nodes.filter(node => node.attr('id') === endId)[0]
    let startPoint = startNode.container.attr('pos')
    let endPoint = endNode.container.attr('pos')
    let startOffset = (startNode.getSizeBox()[2] - startNode.getSizeBox()[0]) / 2
    let endOffset = (endNode.getSizeBox()[2] - endNode.getSizeBox()[0]) / 2
    if (startPoint[0] > endPoint[0]) {
      //计算接入点位置左侧或者右侧
      startOffset = -startOffset
      endOffset = -endOffset
    }
    startPoint = [startPoint[0] + startOffset, startPoint[1]]
    endPoint = [endPoint[0] - endOffset, endPoint[1]]
    let offsetCenterX = Math.abs((endPoint[1] - startPoint[1]) / stageHeight) - 0.5 // [-0.5 ~ +0.5]
    offsetCenterX = ((endPoint[0] - startPoint[0]) * offsetCenterX) / 4
    let centerPoint = [(startPoint[0] + endPoint[0]) / 2 - offsetCenterX, (startPoint[1] + endPoint[1]) / 2]
    let insertSpoint = [centerPoint[0], startPoint[1]]
    let insertEpoint = [centerPoint[0], endPoint[1]]
    let curvePoints = []
    curvePoints[0] = [startPoint[0], startPoint[1], insertSpoint[0], insertSpoint[1], centerPoint[0], centerPoint[1]]
    curvePoints[1] = [centerPoint[0], centerPoint[1], insertEpoint[0], insertEpoint[1], endPoint[0], endPoint[1]]
    //如果坐标存在负数，需要容器偏移矫正
    let allPoints = []
    curvePoints.forEach(point => {
      allPoints = allPoints.concat(point)
    })
    let xPoints = allPoints.filter((num, i) => i % 2 === 0)
    let yPoints = allPoints.filter((num, i) => i % 2 !== 0)
    let minX = Math.min.apply(this, xPoints)
    let minY = Math.min.apply(this, yPoints)
    let groupPos = [0, 0]
    if (minY < 0) {
      curvePoints.forEach(arr => {
        arr.forEach((num, i) => {
          if (i % 2 !== 0) {
            arr[i] = num - minY
          }
        })
      })
      groupPos[1] = minY
    }
    if (minX < 0) {
      curvePoints.forEach(arr => {
        arr.forEach((num, i) => {
          if (i % 2 === 0) {
            arr[i] = num - minX
          }
        })
      })
      groupPos[1] = minX
    }
    this.wrap.attr({ pos: groupPos })
    this.$line.attr({ points: curvePoints })
  }
}
function addNode(pNode, arr, list) {
  if (arr && arr.length) {
    let pLevel = pNode.attr('level')
    arr.forEach(item => {
      let nodeData = { children: [], level: pLevel + 1, attrs: filterClone(item, [], ['children']) }
      let curNode = new MindNode({ level: pLevel + 1, text: item.text, children: item.children })
      curNode.pNode = pNode
      nodeData.node = curNode
      curNode.data = nodeData
      let curLink = new MindLink({ startId: pNode.attr('id'), endId: curNode.attr('id') })
      this.append([curNode, curLink])
      if (item.children) {
        addNode.bind(this)(curNode, item.children, nodeData.children)
      }
      list.push(nodeData)
    })
  }
}
export { SpriteMind, MindNode, MindLink }
