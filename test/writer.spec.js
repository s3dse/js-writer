/* eslint-disable no-unused-expressions */
const { Writer } = require('./../src/writer')
const moment = require('moment')
const chai = require('chai')
chai.should()

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('Writer monad', () => {
    it('should follow left identity law', () => {
        const testFunc = x => Writer.of(9 + x)
        const m1 = testFunc(1)
        const m2 = Writer.of(1).flatMap(testFunc)
        m1.equals(m2).should.be.true
    })

    it('should follow right identity law', () => {
        const writer = Writer(4, 'This is 4')
        const chained = writer.flatMap(Writer.of)
        chained.equals(writer).should.be.true
    })

    it('should follow setoid rules', () => {
        Writer.of(5).equals(Writer.of(6)).should.be.false
        Writer(5, '5').equals(Writer.of(5)).should.be.false
        Writer(6, '5 + 1').equals(Writer.of(6)).should.be.false
        Writer.of(5 + 1).equals(Writer.of(6)).should.be.true
    })

    it('should hold logs through processing chain', () => {
        const result = Writer.of(4)
            .flatMap(x => Writer(x * 2, `${x} was doubled.`))
            .flatMap(x => Writer(x / 2, `${x} was halved.`))
            .map(x => x)
        result.log.length.should.equal(2)
        result.log[0].should.equal('4 was doubled.')
        result.log[1].should.equal('8 was halved.')
        result.value.should.equal(4)
    })

    it('should be semigroupable', () => {
        const {value, log} = writerA = Writer.of([1, 2, 3, 4, 4, 2, 3, 4, 5])
            .map(x => [...new Set(x)])
            .flatMap(x => Writer(x, `unique values are ${x}`))

        value.should.deep.equal([1, 2, 3, 4, 5])
        log.should.deep.equal(['unique values are 1,2,3,4,5'])

        const writerB = Writer.of(4).flatMap(x => Writer([...Array(x).keys()], 'Array from range'))
        const concattedWriter = writerA.concat(writerB)
        
        concattedWriter.log.should.deep.equal(['unique values are 1,2,3,4,5', 'Array from range'])
        concattedWriter.value.should.deep.equal([1, 2, 3, 4, 5, 0, 1, 2, 3])
    })
})

describe('Writer monad in action', () => {
    it('should work', () => {
        const { value, log } = Writer.of([1, 2, 3, 4, 4, 2, 3, 4, 5])
            .map(x => [...new Set(x)])
            .flatMap(x => Writer(x, `unique values are ${x}`))

        value.should.deep.equal([1, 2, 3, 4, 5])
        log.should.deep.equal(['unique values are 1,2,3,4,5'])
    })

    it('log should have time of operation', async () => {
        const w = Writer.of(0)
        const list = ['a', 'b', 'c']
        await delay(1000)
        const w1 = w.flatMap(x => Writer(x, list[0]))
        await delay(1000)
        const w2 = w1.flatMap(x => Writer(x, list[1]))
        await delay(1000)
        const result = w2.flatMap(x => Writer(x, list[2]))
        result.log.should.deep.equal(['a', 'b', 'c'])
        moment(result.time[0], moment.defaultFormat).isBefore(moment(result.time[1], moment.defaultFormat))
            .should.be.true
        moment(result.time[1], moment.defaultFormat).isBefore(moment(result.time[2], moment.defaultFormat))
            .should.be.true
    })
})
