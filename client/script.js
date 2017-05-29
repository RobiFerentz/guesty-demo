/**
 * Created by robertferentz on 2017-05-25.
 */

function createMap() {
  let map
  let heatmap

  fetch('points.json')
    .then(response => response.json())
    .then(points => points.map(p => { return {location: new google.maps.LatLng(p[0], p[1]), weight: p[2]}}))
    .then(pts => {

      map = new google.maps.Map(document.getElementById('heatmap'), {
        zoom: 11,
        center: pts[0].location,
        mapTypeId: 'satellite'
      });

      heatmap = new google.maps.visualization.HeatmapLayer({
        data: pts,
        map: map
      });
    })

}
