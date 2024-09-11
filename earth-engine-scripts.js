// Select area of case study
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

Map.centerObject (geometry); // Output 1


var time_start = '2021', time_end = '2022' // Select which year and month of image data we want to collect

// Reduce speckle noise in an image
function speckel(img){
  return img.focalMedian(100, 'square', 'meters')
  .copyProperties(img, img.propertyNames())
  }

// Let's proceed the image on 2021 January (during the flood)
var before = imageCollection
.filterDate (time_start, time_end)
.filter(ee.Filter.calendarRange(1, 1, 'month')) // 1 means January (first month)
.filterBounds (geometry)
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')) // filtering, processing, and aggregating radar imagery
.filter(ee.Filter.eq('instrumentMode', 'IW'))
.map(speckel)
.select('VV')
.min();

Map.addLayer(before.clip(geometry),[],'before', false); // Output 2


// Let's proceed the image on 2021 July (after the flood)
var after = imageCollection
.filterDate (time_start, time_end)
.filter(ee.Filter.calendarRange(7, 7, 'month')) // 7 means July (7th month)
.filterBounds (geometry)
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')) // filtering, processing, and aggregating radar imagery
.filter(ee.Filter.eq('instrumentMode', 'IW'))
.map(speckel)
.select('VV')
.min();

Map.addLayer(after.clip(geometry),[],'after', false); // Output 3


var change = before.subtract(after).rename('flood') // Changes of image between before and after 

Map.addLayer(change.clip(geometry),[],'flood', false) // Output 4

// To understand the distribution of flood within the image.
print(
  ui.Chart.image.histogram(change, geometry, 100) 
  ) // Output 5
  
//Calculate the flood area
var flood_thr = change.gt(-5); // we pick -5 value as the minimum threshold to detect flood
var flood_mask = flood_thr.updateMask(flood_thr);
var flood_area = flood_mask.multiply(ee.Image.pixelArea().divide(1e6));
var area_sum = flood_area.reduceRegion({
  reducer: ee.Reducer.sum(), geometry: geometry, scale: 100
  }).values().get(0);
  
print(ee.Number(area_sum).round()) // Output 6

