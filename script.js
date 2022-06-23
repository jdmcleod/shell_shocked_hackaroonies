export default class Canvas {
  constructor(id) {
    this._canvas = document.getElementById(id)

    this.resize()
  }

  get canvas() { return this._canvas }
  get ctx() { return this.canvas.getContext('2d') }

  resize(){
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawCrosshair(x, y) {
    const radius = 15
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI)
    this.ctx.stroke()
    this.ctx.moveTo(x - radius, y)
    this.ctx.lineTo(x + radius, y)
    this.ctx.moveTo(x, y - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.stroke()
  }
}

const canvas = new Canvas('canvas')

const state = {
  hasCalibrated: false,
  startPosition: false,
  endPosition: false,
}

window.addEventListener('load', ()=>{
  function getPosition(event){
    const x = event.clientX
    const y = event.clientY
    return { x, y }
  }

  function handleMouseMove(event) {
    draw(event)
  }

  function handleMouseDown(event) {
    if (!state.startPosition) {
      return state.startPosition = getPosition(event)
    }

    if (!state.endPosition) {
      state.endPosition = getPosition(event)
    }
  }

  function calculatePower() {
    const g = -297 // This constant was found by playing around until it worked
    const velocityToPowerRatio = 0.0518718 // Derived from getting slope of line in power to time linear graph

    const x = Math.abs(state.endPosition.x - state.startPosition.x)
    const y = -1 * (state.endPosition.y - state.startPosition.y)

    const degreesToRadians = 0.01745329
    let possibleAngles = [69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87]
    let possibleNumbers = []

    possibleAngles.forEach(angle => {
      const radians = angle * degreesToRadians
      const numerator = -1 * g * Math.pow(x, 2)
      const denominator = 2 * Math.pow(Math.cos(radians), 2) * (Math.tan(radians) * x - y)
      const squareRoot = Math.sqrt(Math.abs(numerator / denominator))
      const power = (-2 / (g * velocityToPowerRatio)) * squareRoot
      possibleNumbers.push([angle, power])
    })

    // Figure out which power number is furthest away from .5
    const sortedNumbers = possibleNumbers.filter(result => result[1] < 100).sort((a, b) => {
      const powerADecimal = parseInt(a[1].toString().split('.')[1].slice(0, 3))
      const powerBDecimal = parseInt(b[1].toString().split('.')[1].slice(0, 3))
      return Math.abs(powerADecimal - 500) - Math.abs(powerBDecimal- 500)
    })

    const bestNumber = sortedNumbers[sortedNumbers.length - 1]
    bestNumber[1] = Math.round(bestNumber[1] * 100) / 100

    return bestNumber
  }

  function drawText() {
    canvas.ctx.fillStyle = 'white'
    canvas.ctx.font = '30px Arial'
    canvas.ctx.fillText(calculatePower(), state.startPosition.x + 30, state.startPosition.y + 30)
  }

  function draw(event) {
    const { x, y } = getPosition(event)
    canvas.clear()
    canvas.ctx.strokeStyle = 'white'
    canvas.drawCrosshair(x, y)
    canvas.ctx.strokeStyle = 'green'
    canvas.drawCrosshair(state.startPosition.x, state.startPosition.y)
    canvas.ctx.strokeStyle = 'red'
    canvas.drawCrosshair(state.endPosition.x, state.endPosition.y)

    if (state.startPosition && state.endPosition) drawText()
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mousedown', handleMouseDown)
})

