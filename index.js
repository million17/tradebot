const ccxt = require('ccxt');
const moment = require('moment')
const delay = require('delay')
require('dotenv').config()
const fs = require('fs')

const binance = new ccxt.binance({
    apiKey: process.env.API_KEY,
    secret: process.env.SECRET
})
binance.setSandboxMode(true)
async function printBinance(btcPrice) {
    const balance = await binance.fetchBalance()
    const { total } = balance
    console.log(`Balance: BTC ${total.BTC}, USDT ${total.USDT}`);
    console.log(`Total: USDT ${(total.BTC - 1) * btcPrice + total.USDT}. \n`);
}
async function tick() {
    const array = []
    const prices = await binance.fetchOHLCV('BTC/USDT', '1m', undefined, 5)
    const bPrices = prices.map(price => {
        return {
            timestamp: moment(price[0]).format(),
            open: price[1],
            hight: price[2],
            low: price[3],
            close: price[4],
            volume: price[5]
        }
    })
    const averagePrice = bPrices.reduce((acc, price) => acc + price.close, 0) / 5
    const lastPrice = bPrices[bPrices.length - 1].close
    console.log(bPrices.map(p => p.close), 'AveragePrice : ', averagePrice, 'LastPrice ', lastPrice);
    const direction = lastPrice > averagePrice ? 'sell' : 'buy'
    const TRADE_SIZE = 100;
    const quantity = TRADE_SIZE / lastPrice
    console.log(`Average Price: ${averagePrice}. Last Price: ${lastPrice}`);
    const order = await binance.createMarketOrder('BTC/USDT', direction, quantity)
    console.log(`${moment().format()}: ${direction} ${quantity} BTC at ${lastPrice}`);
    printBinance(lastPrice)
    array.push({
        name: bPrices.map(p => p.close) + 'AveragePrice : ' + averagePrice + 'LastPrice ' + lastPrice
    })
    // try {
    //     fs.writeFile('trade-bot.txt', JSON.stringify(array), (err) => {
    //         if (err) {
    //             console.log('err', err);
    //         }
    //     })
    // } catch (error) {
    //     console.log(error);
    // }
}
async function main() {
    while (true) {
        await tick()
        await delay(60 * 1000)
    }
}
main()