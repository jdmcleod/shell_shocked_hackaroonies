class Canvas {
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

class OptimalShotCalculator {
  static get GRAVITY()  { return -297 } // This constant was found by playing around until it worked
  static get VELOCITY_TO_POWER() { return 0.0518718 } // Derived from getting slope of line in power to time linear graph
  static get DEGREES_TO_RADIANS() { return 0.01745329 }
  static get POSSIBLE_ANGLES() { return [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87] }

  /**
   * Takes the x and y distance to the enemy tank
   * @param x
   * @param y
   */
  constructor(x, y) {
    this._x = x
    this._y = y
  }

  get x() { return this._x }
  get y() { return this._y }

  calculateOptimalShot() {
    const possibleShotsSortedByClosestToWholeNumber = this.calculatePossibleShots().sort((a, b) => {
      const powerADecimal = parseInt(a[1].toString().split('.')[1].slice(0, 3))
      const powerBDecimal = parseInt(b[1].toString().split('.')[1].slice(0, 3))
      return Math.abs(powerADecimal - 500) - Math.abs(powerBDecimal- 500)
    })

    const bestShot = possibleShotsSortedByClosestToWholeNumber[possibleShotsSortedByClosestToWholeNumber.length - 1]
    bestShot[1] = Math.round(bestShot[1] * 100) / 100

    return bestShot
  }

  calculatePossibleShots() {
    const shotOptions = []

    this.constructor.POSSIBLE_ANGLES.forEach(angle => {
      shotOptions.push([angle, this._calculatePowerForAngle(angle)])
    })

    return shotOptions.filter(result => result[1] < 100)
  }

  /**
   * Use formula derived in this article https://steamcommunity.com/sharedfiles/filedetails/?id=1327582953
   * @param angle
   * @returns {number}
   * @private
   */
  _calculatePowerForAngle(angle) {
    const radians = angle * this.constructor.DEGREES_TO_RADIANS
    const numerator = -1 * this.constructor.GRAVITY * Math.pow(this.x, 2)
    const denominator = 2 * Math.pow(Math.cos(radians), 2) * (Math.tan(radians) * this.x - this.y)
    const squareRoot = Math.sqrt(Math.abs(numerator / denominator))
    const power = (-2 / (this.constructor.GRAVITY * this.constructor.VELOCITY_TO_POWER)) * squareRoot
    return power
  }
}

const canvas = new Canvas('canvas')

const state = {
  startPosition: false,
  endPosition: false,
  power: undefined
}

window.addEventListener('load', ()=> {
  let allShotOptionsDiv = document.getElementById('possible-shots')

  function getPosition(event){
    const x = event.clientX
    const y = event.clientY
    return { x, y }
  }

  function reset() {
    state.startPosition = false
    state.endPosition = false
    state.power = undefined
    allShotOptionsDiv.innerText = 'Angle | Power'

    canvas.clear()
  }

  function calculatePower() {
    if (state.power) return state.power
    const xDistance = Math.abs(state.endPosition.x - state.startPosition.x)
    const yDistance = -1 * (state.endPosition.y - state.startPosition.y)
    const calculator = new OptimalShotCalculator(xDistance, yDistance)
    state.power = calculator.calculateOptimalShot()
    return state.power
  }

  function printAllShotOptions() {
    if (!state.power) return
    const xDistance = Math.abs(state.endPosition.x - state.startPosition.x)
    const yDistance = -1 * (state.endPosition.y - state.startPosition.y)
    const calculator = new OptimalShotCalculator(xDistance, yDistance)
    const allOptions = calculator.calculatePossibleShots()
    allShotOptionsDiv.innerText = `Angle | Power \n\n ${allOptions.map(option => `(${option[0]}, ${Math.round(option[1] * 100) / 100})\n`).join('')}`
  }

  function drawText() {
    canvas.ctx.fillStyle = 'white'
    canvas.ctx.font = '30px Arial'
    canvas.ctx.fillText(calculatePower(), state.startPosition.x + 30, state.startPosition.y + 30)
    printAllShotOptions()
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

  function handleMouseMove(event) {
    draw(event)
  }

  function handleMouseDown(event) {
    if (!state.startPosition) {
      return state.startPosition = getPosition(event)
    }

    if (!state.endPosition) {
      state.endPosition = getPosition(event)
      draw(event)
    }
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mousedown', handleMouseDown)
  document.getElementById('reset-button').onclick = reset
})

