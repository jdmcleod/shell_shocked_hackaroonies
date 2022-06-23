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

  // const acceleration = -0.006623241
  // const pixelDistanceInCalibratingShot = 673 // angle 80 from barrel to endpoint on flat turf. Will vary with screen resolution. I used mac's screenshot tool to measure.
  // const timeForCalibratingShot = 5.093 // In seconds - angle 80 on flat turf
  // const xVelocity = pixelDistanceInCalibratingShot / timeForCalibratingShot
  // const g = 2 * acceleration * Math.pow(xVelocity, 2)


  function calculatePower() {
    const g = -297 // This constant was found by playing around until it worked
    const velocityToPowerRatio = 0.0518718 // Derived from getting slope of line in power to time linear graph

    const x = Math.abs(state.endPosition.x - state.startPosition.x)
    const y = -1 * (state.endPosition.y - state.startPosition.y)

    const degreesToRadians = 0.01745329
    const chosenAngle = 71 * degreesToRadians

    const numerator = -1 * g * Math.pow(x, 2)
    const denominator = 2 * Math.pow(Math.cos(chosenAngle), 2) * (Math.tan(chosenAngle) * x - y)
    const squareRoot = Math.sqrt(numerator / denominator)
    const power = (-2 / (g * velocityToPowerRatio)) * squareRoot

    return power
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

