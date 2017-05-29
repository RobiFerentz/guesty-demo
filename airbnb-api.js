/**
 * Created by robertferentz on 2017-05-25.
 */
const rp = require('request-promise')
const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.61 Safari/537.36'
}

const uri = 'https://www.airbnb.com/api/v2/explore_tabs'
const baseQS = {
  version: '1.1.3',
  _format: 'for_explore_search_web',
  items_per_grid: 300,
  experiences_per_grid: 0,
  guidebooks_per_grid: 0,
  fetch_filters: true,
  supports_for_you_v3: true,
  screen_size: 'large',
  timezone_offset: 180,
  auto_ib: true,
  tab_id: 'home_tab',
  location: '',
  adults: 1,
  //allow_override%5B%5D=
  guests: 1,
  price_max: 2000,
  // room_types%5B%5D=Entire+home%2Fapt,
  federated_search_session_id: '899061b7-a8ab-44b6-9964-8700066443a7',
  _intents: 'p1',
  key: 'd306zoyjsyarp7ifhu67rjxn52tv0t20',
  currency: 'ILS',
  locale: 'en'
}

let d = new Date()
d = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()+1)

module.exports = {
  async getNeighborhoods(location) {
    let items = []
    try {
      let qs = Object.assign({}, baseQS, {items_per_grid: 10, fetch_city_neighborhoods: true, location})
      let res = await rp({uri, qs, headers, json: true})
      items = res.explore_tabs[0].home_tab_metadata.facets.neighborhood_facet.map(item => item.value)
    } catch (e) {
      console.log(e)
    }
    return items
  },

  async getListings(city, neighborhoods, limit = 1000) {
    let allListings = []
    try {
      for (let n of neighborhoods) {
        let location = `${city} ${n}`
        let qs = Object.assign({}, baseQS, {items_per_grid: 300, location})
        let res = await rp({uri, qs, headers, json: true})

        let listings = (res && res.explore_tabs[0] && res.explore_tabs[0].sections[0] && res.explore_tabs[0].sections[0].listings) || []
        console.log(`Retrieved ${listings.length} listings for ${location}`)
        allListings = [...allListings, ...listings]
        if (allListings.length >= limit) break
      }

    } catch (e) {
      console.log(e)
    }
    return allListings.map(l => {
      let {pricing_quote, listing} = l
      listing.price = pricing_quote.rate.amount
      return listing
    })
  },

  async getListingDemand(listing) {
    try {
      let nUri = `https://www.airbnb.com/api/v2/calendar_months`
      let nQs = {
        listing_id: listing.id,
        key: '3092nxybyb0otqw18e8nh5nty',
        currency: 'ILS',
        locale: 'en',
        month: d.getMonth(),
        year: d.getFullYear(),
        count: 1, // grab only one month, should be enough for now
        _format: 'with_conditions'
      }
      let cal = await rp({uri: nUri, qs: nQs, headers, json: true})
      listing.demand = cal.calendar_months[0] && cal.calendar_months[0].days.filter(({available})=>!available).length
    } catch (e) {
      console.log(e)
    }

    return listing
  }
}
