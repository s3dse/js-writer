const inspect = Symbol.for('nodejs.util.inspect.custom')
const moment = require('moment')
moment.defaultFormat = 'DD.MM.YYYY HH:mm:ss'

const Writer = (value, log = [], time = [moment().format()]) => ({
    value,
    log,
    time,
    map: f => Writer(f(value), log, time),
    ap: m => Writer(m.value(value), m.log.concat([], log), m.time.concat([], time)),
    flatMap: f => {
        const tuple = f(value)
        return Writer(tuple.value, log.concat(tuple.log), time.concat(tuple.time))
    },
    concat: m => Writer(value.concat(m.value), log.concat(m.log)),
    equals: m => {
        const valueEqual = value === m.value
        const logA = [...log]
        const logB = [...m.log]
        const logEqual = logA.length === logB.length &&
            logA.every((element, index) => logB[index] === element)
        return valueEqual && logEqual
    },
    timedLog: () => time.map((element, index) => `[${element}] ${log[index]}`),
    [inspect]: () => `Writer(${value}, ${log})`
})

Writer.of = x => Writer(x, [], [])

module.exports = {
    Writer
}
