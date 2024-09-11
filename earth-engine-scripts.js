var imageCollection = ee.ImageCollection("COPERNICUS/S1_GRD"),
    geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[114.57209814624795, -3.2747751904408777],
          [114.57209814624795, -3.4790401501785615],
          [114.91198767261514, -3.4790401501785615],
          [114.91198767261514, -3.2747751904408777]]], null, false);


Map.centerObject (geometry);

var time_start = '2021', time_end = '2022'

function speckel(img){
  return img.focalMedian(100, 'square', 'meters')
  .copyProperties(img, img.propertyNames())
  }

var before = imageCollection
.filterDate (time_start, time_end)
.filter(ee.Filter.calendarRange(1, 1, 'month'))
.filterBounds (geometry)
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
.filter(ee.Filter.eq('instrumentMode', 'IW'))
.map(speckel)
.select('VV')
.min();

Map.addLayer(before.clip(geometry),[],'before', false);

var after = imageCollection
.filterDate (time_start, time_end)
.filter(ee.Filter.calendarRange(7, 7, 'month'))
.filterBounds (geometry)
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
.filter(ee.Filter.eq('instrumentMode', 'IW'))
.map(speckel)
.select('VV')
.min();

Map.addLayer(after.clip(geometry),[],'after', false);


var change = before.subtract(after).rename('flood')

Map.addLayer(change.clip(geometry),[],'flood', false)

print(
  ui.Chart.image.histogram(change, geometry, 100)
  )
  
var flood_thr = change.gt(2);
var flood_mask = flood_thr.updateMask(flood_thr);
var flood_area = flood_mask.multiply(ee.Image.pixelArea().divide(1e6));
var area_sum = flood_area.reduceRegion({
  reducer: ee.Reducer.sum(), geometry: geometry, scale: 100
  }).values().get(0);
  
print(ee.Number(area_sum).round())

