import xw from 'xwind'
import { useBalances } from '../hooks/useBalances'

const BalancesTable = () => {
  const balances = useBalances()
  console.log('balances', balances)

  return (
    <div css={xw`flex flex-col py-6`}>
      <div css={xw`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div css={xw`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {balances.length ? (
            <div
              css={xw`shadow overflow-hidden border-b border-mango-dark-light sm:rounded-md`}
            >
              <table css={xw`min-w-full divide-y divide-mango-dark-light`}>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      css={xw`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Coin
                    </th>
                    <th
                      scope="col"
                      css={xw`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Deposits
                    </th>
                    <th
                      scope="col"
                      css={xw`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Borrows
                    </th>
                    <th
                      scope="col"
                      css={xw`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      In Orders
                    </th>
                    <th
                      scope="col"
                      css={xw`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Unsettled
                    </th>
                    <th
                      scope="col"
                      css={xw`px-6 py-3 text-left text-base font-medium text-gray-300 tracking-wider`}
                    >
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((balance, index) => (
                    <tr
                      key={`${index}`}
                      css={
                        index % 2 === 0
                          ? xw`bg-mango-dark-light`
                          : xw`bg-mango-dark-lighter`
                      }
                    >
                      <td
                        css={xw`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {balance.coin}
                      </td>
                      <td
                        css={xw`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {balance.marginDeposits}
                      </td>
                      <td
                        css={xw`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {balance.borrows}
                      </td>
                      <td
                        css={xw`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {balance.orders}
                      </td>
                      <td
                        css={xw`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {balance.unsettled}
                      </td>
                      <td
                        css={xw`px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light`}
                      >
                        {balance.net}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              css={xw`w-full text-center py-6 text-lg bg-mango-dark-light font-light text-mango-med`}
            >
              No balances
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BalancesTable