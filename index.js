/**
 * Created by robertferentz on 2017-05-25.
 */
const api = require('./airbnb-api')
const fs = require('fs')
const {city = '', listingLimit} = require('./config.json')

const scoreListing = (listing) => {
  let {star_rating = 0, reviews_count = 0, price = 0, demand = 0} = listing
  listing.score = ((star_rating + reviews_count + demand) / (price / 50)) + 1
}

async function main () {
  try {
    console.assert(city, 'No city provided. Process aborted.')

    console.log(`Getting neighborhoods for ${city}`)
    let neighborhoods = await api.getNeighborhoods(city)
    console.assert(neighborhoods && neighborhoods.length, `${city} has no neighbourhoods. Process aborted.`)

    console.log(`Getting listings for ${city}`)
    let listings = await api.getListings(city, neighborhoods, listingLimit)
    console.assert(listings.length, `No listings found for ${city}. Process aborted.`)

    console.log(`Getting demand for all listings`)


    for(let l of listings) {
      await new Promise(async (resolve) => {
        await api.getListingDemand(l)
        scoreListing(l)
        setTimeout(resolve,3000) // delay requests to avoid throttling.
      })
    }

    if(listings.length > listingLimit) {
      listings.sort((a, b) => b.score - a.score)
      listings.length = listingLimit
    }

    console.log(`Writing ${listings.length} listings to file.`)
    fs.writeFileSync('./client/points.json', JSON.stringify(listings.map(({lat, lng, score}) => [lat, lng, score])))
    console.log('Process complete. Enjoy your heatmap!')
  } catch (e) {
    console.error(e.message)
  }
}

main()

