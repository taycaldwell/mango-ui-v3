import { useState, useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import useIpAddress from '../hooks/useIpAddress'
import {
  getTokenBySymbol,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import { notify } from '../utils/notifications'
import { calculateTradePrice, getDecimalCount } from '../utils'
import { floorToDecimal } from '../utils/index'
import useMangoStore from '../stores/useMangoStore'
import Button from './Button'
import TradeType from './TradeType'
import Input from './Input'
import Switch from './Switch'
import { Market } from '@project-serum/serum'
import Big from 'big.js'
import MarketFee from './MarketFee'
import LeverageSlider from './LeverageSlider'
import Loading from './Loading'
import Tooltip from './Tooltip'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import OrderSideTabs from './OrderSideTabs'
import { ElementTitle } from './styles'

const StyledRightInput = styled(Input)`
  border-left: 1px solid transparent;
`

export default function AdvancedTradeForm({ initLeverage }) {
  const set = useMangoStore((s) => s.set)
  const { ipAllowed } = useIpAddress()
  const connected = useMangoStore((s) => s.wallet.connected)
  const actions = useMangoStore((s) => s.actions)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const isPerpMarket = market instanceof PerpMarket
  const [reduceOnly, setReduceOnly] = useState(false)

  const {
    side,
    baseSize,
    quoteSize,
    price,
    tradeType,
    triggerPrice,
    triggerCondition,
  } = useMangoStore((s) => s.tradeForm)
  const isLimitOrder = ['Limit', 'Stop Limit', 'Take Profit Limit'].includes(
    tradeType
  )
  const isMarketOrder = ['Market', 'Stop Loss', 'Take Profit'].includes(
    tradeType
  )
  const isTriggerOrder = [
    'Stop Loss',
    'Stop Limit',
    'Take Profit',
    'Take Profit Limit',
  ].includes(tradeType)

  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const [postOnly, setPostOnly] = useState(false)
  const [ioc, setIoc] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const orderBookRef = useRef(useMangoStore.getState().selectedMarket.orderBook)
  const orderbook = orderBookRef.current
  useEffect(
    () =>
      useMangoStore.subscribe(
        // @ts-ignore
        (orderBook) => (orderBookRef.current = orderBook),
        (state) => state.selectedMarket.orderBook
      ),
    []
  )

  useEffect(() => {
    if (tradeType === 'Market') {
      set((s) => {
        s.tradeForm.price = ''
      })
    }
  }, [tradeType, set])

  useEffect(() => {
    let condition
    switch (tradeType) {
      case 'Stop Loss':
      case 'Stop Limit':
        condition = side == 'buy' ? 'above' : 'below'
        break
      case 'Take Profit':
      case 'Take Profit Limit':
        condition = side == 'buy' ? 'below' : 'above'
        break
    }
    if (condition) {
      set((s) => {
        s.tradeForm.triggerCondition = condition
      })
    }
  }, [set, tradeType, side])

  const setSide = (side) => {
    set((s) => {
      s.tradeForm.side = side
    })
  }

  const setBaseSize = (baseSize) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(baseSize))) {
        s.tradeForm.baseSize = parseFloat(baseSize)
      } else {
        s.tradeForm.baseSize = baseSize
      }
    })

  const setQuoteSize = (quoteSize) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(quoteSize))) {
        s.tradeForm.quoteSize = parseFloat(quoteSize)
      } else {
        s.tradeForm.quoteSize = quoteSize
      }
    })

  const setPrice = (price) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(price))) {
        s.tradeForm.price = parseFloat(price)
      } else {
        s.tradeForm.price = price
      }
    })

  const setTradeType = (type) => {
    set((s) => {
      s.tradeForm.tradeType = type
    })
  }

  const setTriggerPrice = (price) => {
    set((s) => {
      if (!Number.isNaN(parseFloat(price))) {
        s.tradeForm.triggerPrice = parseFloat(price)
      } else {
        s.tradeForm.triggerPrice = price
      }
    })
    if (isMarketOrder) {
      onSetPrice(price)
    }
  }

  const markPriceRef = useRef(useMangoStore.getState().selectedMarket.markPrice)
  const markPrice = markPriceRef.current
  useEffect(
    () =>
      useMangoStore.subscribe(
        (markPrice) => (markPriceRef.current = markPrice as number),
        (state) => state.selectedMarket.markPrice
      ),
    []
  )

  let minOrderSize = '0'
  if (market instanceof Market && market.minOrderSize) {
    minOrderSize = market.minOrderSize.toString()
  } else if (market instanceof PerpMarket) {
    const baseDecimals = getTokenBySymbol(
      groupConfig,
      marketConfig.baseSymbol
    ).decimals
    minOrderSize = new Big(market.baseLotSize)
      .div(new Big(10).pow(baseDecimals))
      .toString()
  }

  const sizeDecimalCount = getDecimalCount(minOrderSize)

  let tickSize = 1
  if (market instanceof Market) {
    tickSize = market.tickSize
  } else if (isPerpMarket) {
    const baseDecimals = getTokenBySymbol(
      groupConfig,
      marketConfig.baseSymbol
    ).decimals
    const quoteDecimals = getTokenBySymbol(
      groupConfig,
      groupConfig.quoteSymbol
    ).decimals

    const nativeToUi = new Big(10).pow(baseDecimals - quoteDecimals)
    const lotsToNative = new Big(market.quoteLotSize).div(
      new Big(market.baseLotSize)
    )
    tickSize = lotsToNative.mul(nativeToUi).toNumber()
  }

  const onSetPrice = (price: number | '') => {
    setPrice(price)
    if (!price) return
    if (baseSize) {
      onSetBaseSize(baseSize)
    }
  }

  const onSetBaseSize = (baseSize: number | '') => {
    const { price } = useMangoStore.getState().tradeForm
    setBaseSize(baseSize)
    if (!baseSize) {
      setQuoteSize('')
      return
    }
    const usePrice = Number(price) || markPrice
    if (!usePrice) {
      setQuoteSize('')
      return
    }
    const rawQuoteSize = baseSize * usePrice
    setQuoteSize(rawQuoteSize.toFixed(6))
  }

  const onSetQuoteSize = (quoteSize: number | '') => {
    setQuoteSize(quoteSize)
    if (!quoteSize) {
      setBaseSize('')
      return
    }

    if (!Number(price) && isLimitOrder) {
      setBaseSize('')
      return
    }
    const usePrice = Number(price) || markPrice
    const rawBaseSize = quoteSize / usePrice
    const baseSize = quoteSize && floorToDecimal(rawBaseSize, sizeDecimalCount)
    setBaseSize(baseSize)
  }

  const onTradeTypeChange = (tradeType) => {
    setTradeType(tradeType)
    if (['Market', 'Stop Loss', 'Take Profit'].includes(tradeType)) {
      setIoc(true)
      if (isTriggerOrder) {
        setPrice(triggerPrice)
      }
    } else {
      const priceOnBook = side === 'buy' ? orderbook?.asks : orderbook?.bids
      if (priceOnBook && priceOnBook.length > 0 && priceOnBook[0].length > 0) {
        setPrice(priceOnBook[0][0])
      }
      setIoc(false)
    }
  }

  const postOnChange = (checked) => {
    if (checked) {
      setIoc(false)
    }
    setPostOnly(checked)
  }
  const iocOnChange = (checked) => {
    if (checked) {
      setPostOnly(false)
    }
    setIoc(checked)
  }
  const reduceOnChange = (checked) => {
    if (checked) {
      setReduceOnly(false)
    }
    setReduceOnly(checked)
  }

  async function onSubmit() {
    if (!price && isLimitOrder) {
      notify({
        title: 'Missing price',
        type: 'error',
      })
      return
    } else if (!baseSize) {
      notify({
        title: 'Missing size',
        type: 'error',
      })
      return
    } else if (!triggerPrice && isTriggerOrder) {
      notify({
        title: 'Missing trigger price',
        type: 'error',
      })
      return
    }

    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const { askInfo, bidInfo } = useMangoStore.getState().selectedMarket
    const wallet = useMangoStore.getState().wallet.current

    if (!wallet || !mangoGroup || !mangoAccount || !market) return
    setSubmitting(true)

    try {
      const orderPrice = calculateTradePrice(
        tradeType,
        orderbook,
        baseSize,
        side,
        price,
        triggerPrice
      )

      if (!orderPrice) {
        notify({
          title: 'Price not available',
          description: 'Please try again',
          type: 'error',
        })
      }

      const orderType = ioc ? 'ioc' : postOnly ? 'postOnly' : 'limit'
      let txid
      if (market instanceof Market) {
        txid = await mangoClient.placeSpotOrder2(
          mangoGroup,
          mangoAccount,
          mangoGroup.mangoCache,
          market,
          wallet,
          side,
          orderPrice,
          baseSize,
          orderType
        )
      } else {
        if (isTriggerOrder) {
          txid = await mangoClient.addPerpTriggerOrder(
            mangoGroup,
            mangoAccount,
            market,
            wallet,
            orderType,
            side,
            orderPrice,
            baseSize,
            triggerCondition,
            Number(triggerPrice)
          )
        } else {
          txid = await mangoClient.placePerpOrder(
            mangoGroup,
            mangoAccount,
            mangoGroup.mangoCache,
            market,
            wallet,
            side,
            orderPrice,
            baseSize,
            tradeType === 'Market' ? 'market' : orderType,
            Date.now(),
            side === 'buy' ? askInfo : bidInfo, // book side used for ConsumeEvents
            reduceOnly
          )
        }
      }
      notify({ title: 'Successfully placed trade', txid })
      setPrice('')
      onSetBaseSize('')
    } catch (e) {
      notify({
        title: 'Error placing order',
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    } finally {
      // TODO: should be removed, main issue are newly created OO accounts
      // await sleep(600)
      actions.reloadMangoAccount()
      actions.loadMarketFills()
      setSubmitting(false)
    }
  }

  const disabledTradeButton =
    (!price && isLimitOrder) ||
    !baseSize ||
    !connected ||
    submitting ||
    !mangoAccount

  return !isMobile ? (
    <div className={!connected ? 'fliter blur-sm' : 'flex flex-col h-full'}>
      <ElementTitle>
        {marketConfig.name}
        <span className="border border-th-primary ml-2 px-1 py-0.5 rounded text-xs text-th-primary">
          {initLeverage}x
        </span>
      </ElementTitle>
      <OrderSideTabs onChange={setSide} side={side} />
      <Input.Group className="mt-4">
        <Input
          type="number"
          min="0"
          step={tickSize}
          onChange={(e) => onSetPrice(e.target.value)}
          value={price}
          disabled={isMarketOrder}
          prefix={'Price'}
          suffix={groupConfig.quoteSymbol}
          className="rounded-r-none"
          wrapperClassName="w-3/5"
        />
        <TradeType
          onChange={onTradeTypeChange}
          value={tradeType}
          offerTriggers={isPerpMarket}
          className="hover:border-th-primary flex-grow"
        />
      </Input.Group>
      {isTriggerOrder && (
        <Input.Group className="mt-4">
          <Input
            type="number"
            min="0"
            step={tickSize}
            onChange={(e) => setTriggerPrice(e.target.value)}
            value={triggerPrice}
            prefix={'Trigger Price'}
            suffix={groupConfig.quoteSymbol}
            className="rounded-r-none"
            // wrapperClassName="w-3/5"
          />
        </Input.Group>
      )}
      <Input.Group className="mt-4">
        <Input
          type="number"
          min="0"
          step={minOrderSize}
          onChange={(e) => onSetBaseSize(e.target.value)}
          value={baseSize}
          className="rounded-r-none"
          wrapperClassName="w-3/5"
          prefixClassName="w-12"
          prefix={'Size'}
          suffix={marketConfig.baseSymbol}
        />
        <StyledRightInput
          type="number"
          min="0"
          step={minOrderSize}
          onChange={(e) => onSetQuoteSize(e.target.value)}
          value={quoteSize}
          className="rounded-l-none"
          wrapperClassName="w-2/5"
          suffix={groupConfig.quoteSymbol}
        />
      </Input.Group>
      <LeverageSlider
        onChange={(e) => onSetBaseSize(e)}
        value={baseSize ? baseSize : 0}
        step={parseFloat(minOrderSize)}
        disabled={false}
        side={side}
        decimalCount={sizeDecimalCount}
        price={calculateTradePrice(
          tradeType,
          orderbook,
          baseSize ? baseSize : 0,
          side,
          price,
          triggerPrice
        )}
      />
      <div className="flex mt-2">
        {isLimitOrder ? (
          <>
            <div className="mr-4">
              <Tooltip
                delay={250}
                placement="left"
                content="Post only orders are guaranteed to be the maker order or else it will be canceled."
              >
                <Switch checked={postOnly} onChange={postOnChange}>
                  POST
                </Switch>
              </Tooltip>
            </div>
            <div className="mr-4">
              <Tooltip
                delay={250}
                placement="left"
                content="Immediate or cancel orders are guaranteed to be the taker or it will be canceled."
              >
                <Switch checked={ioc} onChange={iocOnChange}>
                  IOC
                </Switch>
              </Tooltip>
            </div>
          </>
        ) : null}
        {marketConfig.kind === 'perp' && !isTriggerOrder ? (
          <div>
            <Tooltip
              delay={250}
              placement="left"
              content="Reduce only orders will only reduce your overall position."
            >
              <Switch checked={reduceOnly} onChange={reduceOnChange}>
                Reduce Only
              </Switch>
            </Tooltip>
          </div>
        ) : null}
      </div>
      <div className={`flex py-4`}>
        {ipAllowed ? (
          <Button
            disabled={disabledTradeButton}
            onClick={onSubmit}
            className={`${
              !disabledTradeButton
                ? 'bg-th-bkg-2 border border-th-green hover:border-th-green-dark'
                : 'border border-th-bkg-4'
            } text-th-green hover:text-th-fgd-1 hover:bg-th-green-dark flex-grow`}
          >
            {submitting ? (
              <div className="w-full">
                <Loading className="mx-auto" />
              </div>
            ) : side.toLowerCase() === 'buy' ? (
              market instanceof PerpMarket ? (
                `${baseSize > 0 ? 'Long ' + baseSize : 'Long '} ${
                  marketConfig.name
                }`
              ) : (
                `${baseSize > 0 ? 'Buy ' + baseSize : 'Buy '} ${
                  marketConfig.baseSymbol
                }`
              )
            ) : market instanceof PerpMarket ? (
              `${baseSize > 0 ? 'Short ' + baseSize : 'Short '} ${
                marketConfig.name
              }`
            ) : (
              `${baseSize > 0 ? 'Sell ' + baseSize : 'Sell '} ${
                marketConfig.baseSymbol
              }`
            )}
          </Button>
        ) : (
          <Button disabled className="flex-grow">
            <span>Country Not Allowed</span>
          </Button>
        )}
      </div>
      <div className="flex text-xs text-th-fgd-4 px-6 mt-2.5">
        <MarketFee />
      </div>
    </div>
  ) : (
    <div className="flex flex-col h-full">
      <div className={`flex pb-3 text-base text-th-fgd-4`}>
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 outline-none focus:outline-none`}
        >
          <div
            className={`hover:text-th-green pb-1 transition-colors duration-500
            ${
              side === 'buy'
                ? `text-th-green hover:text-th-green border-b-2 border-th-green`
                : undefined
            }`}
          >
            Buy
          </div>
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 outline-none focus:outline-none`}
        >
          <div
            className={`hover:text-th-red pb-1 transition-colors duration-500
            ${
              side === 'sell'
                ? `text-th-red hover:text-th-red border-b-2 border-th-red`
                : undefined
            }
          `}
          >
            Sell
          </div>
        </button>
      </div>
      <div className="pb-3">
        <label className="block mb-1 text-th-fgd-3 text-xs">Price</label>
        <Input
          type="number"
          min="0"
          step={tickSize}
          onChange={(e) => onSetPrice(e.target.value)}
          value={price}
          disabled={tradeType === 'Market'}
          suffix={
            <img
              src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
              width="16"
              height="16"
            />
          }
        />
      </div>
      <div className="flex items-center justify-between pb-3">
        <label className="text-th-fgd-3 text-xs">Type</label>
        <TradeType
          onChange={onTradeTypeChange}
          value={tradeType}
          className=""
        />
      </div>

      <label className="block mb-1 text-th-fgd-3 text-xs">Size</label>
      <div className="grid grid-cols-2 grid-rows-1 gap-2">
        <div className="col-span-1">
          <Input
            type="number"
            min="0"
            step={minOrderSize}
            onChange={(e) => onSetBaseSize(e.target.value)}
            value={baseSize}
            suffix={
              <img
                src={`/assets/icons/${marketConfig.baseSymbol.toLowerCase()}.svg`}
                width="16"
                height="16"
              />
            }
          />
        </div>
        <div className="col-span-1">
          <Input
            type="number"
            min="0"
            step={minOrderSize}
            onChange={(e) => onSetQuoteSize(e.target.value)}
            value={quoteSize}
            suffix={
              <img
                src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
                width="16"
                height="16"
              />
            }
          />
        </div>
      </div>
      <LeverageSlider
        onChange={(e) => onSetBaseSize(e)}
        value={baseSize ? baseSize : 0}
        step={parseFloat(minOrderSize)}
        disabled={false}
        side={side}
        decimalCount={sizeDecimalCount}
        price={calculateTradePrice(
          tradeType,
          orderbook,
          baseSize ? baseSize : 0,
          side,
          price,
          triggerPrice
        )}
      />
      {tradeType !== 'Market' ? (
        <div className="flex mt-2">
          <Switch checked={postOnly} onChange={postOnChange}>
            POST
          </Switch>
          <div className="ml-4">
            <Switch checked={ioc} onChange={iocOnChange}>
              IOC
            </Switch>
          </div>
        </div>
      ) : null}
      <div className={`flex py-4`}>
        {ipAllowed ? (
          side === 'buy' ? (
            <Button
              disabled={disabledTradeButton}
              onClick={onSubmit}
              className={`${
                !disabledTradeButton
                  ? 'bg-th-bkg-2 border border-th-green hover:border-th-green-dark'
                  : 'border border-th-bkg-4'
              } text-th-green hover:text-th-fgd-1 hover:bg-th-green-dark flex-grow`}
            >
              {submitting ? (
                <div className="w-full">
                  <Loading className="mx-auto" />
                </div>
              ) : (
                `${baseSize > 0 ? 'Buy ' + baseSize : 'Buy '} ${
                  marketConfig.name.includes('PERP')
                    ? marketConfig.name
                    : marketConfig.baseSymbol
                }`
              )}
            </Button>
          ) : (
            <Button
              disabled={disabledTradeButton}
              onClick={onSubmit}
              className={`${
                !disabledTradeButton
                  ? 'bg-th-bkg-2 border border-th-red hover:border-th-red-dark'
                  : 'border border-th-bkg-4'
              } text-th-red hover:text-th-fgd-1 hover:bg-th-red-dark flex-grow`}
            >
              {submitting ? (
                <div className="w-full">
                  <Loading className="mx-auto" />
                </div>
              ) : (
                `${baseSize > 0 ? 'Sell ' + baseSize : 'Sell '} ${
                  marketConfig.name.includes('PERP')
                    ? marketConfig.name
                    : marketConfig.baseSymbol
                }`
              )}
            </Button>
          )
        ) : (
          <Button disabled className="flex-grow">
            <span>Country Not Allowed</span>
          </Button>
        )}
      </div>
      <div className="flex text-xs text-th-fgd-4 px-6 mt-2.5">
        <MarketFee />
      </div>
    </div>
  )
}
