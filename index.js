// 政府口罩數JSON
async function fetchAQI(complete) {
    await fetch('https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json?fbclid=IwAR0oowBRjj1goAMqtnugBiXMTMY8OCl14TGmgt3YDJi9w5BXs4VsfZQ9mDI')
        .then(function (response) {
            return response.json()
        })
        .then(function (jsonObj) {
            complete(jsonObj['features'])
        })
}

// 台灣鄉鎮地區JSON
async function fetchCounty() {
    await fetch('https://raw.githubusercontent.com/donma/TaiwanAddressCityAreaRoadChineseEnglishJSON/master/CityCountyData.json')
        .then(function (response) {
            return response.json()
        })
        .then(function (countyjs) {
            let optgroup
            let opt0
            let opt1
            for (let i = 0; i < countyjs.length; i++) {
                opt0 = document.createElement('option')
                opt0.text = countyjs[i].CityName
                opt0.value = countyjs[i].CityName
                county.add(opt0)
                optgroup = document.createElement('optgroup')
                optgroup.id = countyjs[i].CityName
                optgroup.label = countyjs[i].CityName
                district.add(optgroup)
                for (let l = 0; l < countyjs[i]['AreaList'].length; l++) {
                    opt1 = document.createElement('option')
                    opt1.text = countyjs[i]['AreaList'][l].AreaName
                    opt1.value = countyjs[i]['AreaList'][l].AreaName
                    let x = document.getElementById(countyjs[i].CityName)
                    x.appendChild(opt1)
                }
            }
        })
    hide()
}

function hide() {
    $("#district").children().hide()
}

function changeDis() {
    const $select = document.querySelector('#district');
    const $option = $select.querySelector('#default');
    $select.value = $option.value;
    hide()
    let x = '#' + document.getElementById('county').value
    $(x).show()
}

function geoLocation(latitude, longitude) {
    let lat = parseFloat(latitude)
    let lng = parseFloat(longitude)
    return { lat: lat, lng: lng }
}

function search(aaa, county, town) {
    let arr = []
    for (cou of aaa) {
        if (cou['properties']['county'] == county & cou['properties']['town'] == town) {
            arr.push(cou)
        }
    }
    return arr
}

// 口罩數量對應顏色
function getColor(mask) {
    let imask = parseInt(mask)
    if (imask < 500) return 'red'
    if (imask < 1000) return 'yellow'
    if (imask > 1000) return 'lawngreen'
}

// GoogleMap啟動
function initMap() {
    fetchCounty()
    let markers = []
    let infoarr = []

    let response = document.createElement('div')
    response.id = 'response'
    response.innerText = ''

    let map = new google.maps.Map($('#map').get(0), {
        center: { lat: 23.546162, lng: 120.64021 },
        zoom: 8,
        mapTypeControl: false,
        mapId: 'dc4bac19bef32a3e',
    });

    map.controls[google.maps.ControlPosition.LEFT_TOP].push(response);

    fetchAQI(function (features) {
        $('#bn').click(function () {
            for (let i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
            }
            markers = []
            let countys = $('#county').val()
            let districts = $('#district').val()
            let test = search(features, countys, districts)

            if (districts == '請選擇區域') {
                alert('請先選擇區域')
            }
            if (districts != '請選擇區域' & test[0] == null) {
                alert('此區域無藥局販賣口罩')
            }

            map.setCenter(geoLocation(test[0].geometry.coordinates[1], test[0].geometry.coordinates[0]))
            map.setZoom(12)

            response.style.display = 'block'
            response.innerText = null
            test.forEach(function (record) {
                let store = record.properties.name
                let phone = record.properties.phone
                let address = record.properties.address
                let mask = JSON.stringify(record.properties.mask_adult)

                let infoContent = `
                <div style="margin-bottom:-10px; margin-top:-10px">
                <h4>商店名稱:${store}</h4>
                <h4>電話:${phone}</h4>
                <h4>地址:${address}</h4>
                <h4>口罩數量:${mask}</h4>
                </div>`

                let responseContent = `
                <p>商店名稱:${store}  電話:${phone}</p>
                <p>地址:${address}</p>
                <p>口罩數量:${mask}</p> <hr>
                `
                response.innerHTML += responseContent

                let pinViewScaled = new google.maps.marker.PinView({
                    scale: 1.2,
                    glyph: mask,
                    background: getColor(mask)
                });

                let myLatLng = (geoLocation(record.geometry.coordinates[1], record.geometry.coordinates[0]))
                let infowindow = new google.maps.InfoWindow({
                    content: infoContent,
                    maxWidth: 200,
                })
                infoarr.push(infowindow)
                let marker = new google.maps.marker.AdvancedMarkerView({
                    position: myLatLng,
                    map: map,
                    title: store,
                    content: pinViewScaled.element,
                })

                map.addListener('click', () => {
                    infoarr.forEach(ele => ele.close())
                })

                marker.addListener('click', () => {
                    infoarr.forEach(ele => ele.close())
                    infowindow.open({
                        anchor: marker,
                        map
                    })
                })
                markers.push(marker)
            })

        })

    })
}
window.initMap = initMap