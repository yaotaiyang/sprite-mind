import { layered, chebyshev, manhattan, euclidean, orthogonal } from 'auto-layouter'
import { Node, Link, Stage } from 'sprite-nodes-links'
import { Polyline } from 'spritejs'
import filterClone from 'filter-clone'
let stage = new Stage({
  selector: '#app',
  size: [800, 600]
})
let node1 = new Node({ pos: [200, 200], fixed: true, text: '不受力固定点' })
let node2 = new Node({ pos: [200, 200], fixed: true, text: 'y轴受力', forceAxis: 'y' })
let node3 = new Node({ pos: [200, 200], fixed: true, text: '自由节点1' })
let node4 = new Node({ pos: [200, 200], fixed: true, text: '自由节点2' })
let node5 = new Node({ pos: [200, 200], fixed: true, text: '自由节点3' })

let arrLinks = [
  { startId: node1.attr('id'), endId: node2.attr('id') },
  { startId: node2.attr('id'), endId: node3.attr('id') },
  { startId: node3.attr('id'), endId: node5.attr('id') },
  { startId: node4.attr('id'), endId: node5.attr('id') },
  { startId: node5.attr('id'), endId: node1.attr('id') }
]
stage.append([node1, node2, node3, node4, node5])
let layer = stage.layers.default

//stage.append([node1, node2, node3, node4])
stage.checkForceLink(true)
window.stage = stage
let nodes = []
let edges = []
stage.nodes.forEach(node => {
  let sizeBox = node.sizeBox
  let width = sizeBox[2] - sizeBox[0]
  let height = sizeBox[3] - sizeBox[1]
  nodes.push({ $dom: node, id: node.__attrs.id, width, height })
})
arrLinks.forEach(link => {
  //数据转换
  let { startId: v, endId: w } = link
  let edge = { v, w }
  edge.$line = new Polyline()
  layer.append(edge.$line)
  edges.push(edge)
})
const graph = {
  nodes,
  edges
}
layered(graph)

let boxs = filterClone(nodes, ['x', 'y', 'width', 'height', 'id'])
console.log(boxs)
edges.forEach(edge => {
  let startNode = nodes.filter(n => n.id === edge.v)[0]
  let endNode = nodes.filter(n => n.id === edge.w)[0]
  edge.from = {
    x: startNode.x,
    y: startNode.y,
    direction: 'mid'
  }
  edge.to = {
    x: endNode.x,
    y: endNode.y,
    direction: 'mid'
  }
  let pBoxs = boxs.filter(box => box.id !== startNode.id && box.id !== endNode.id)
  pBoxs = filterClone(pBoxs, [], ['id'])
  edge.points = orthogonal(edge.from, edge.to, pBoxs)
  edge.$line.attr({ points: edge.points.map(p => [p.x, p.y]) })
})
console.log(edges)
graph.nodes.forEach(node => {
  node.$dom.attr({ pos: [node.x, node.y] })
})

console.log(graph)
