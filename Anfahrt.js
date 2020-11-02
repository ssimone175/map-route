
import all from "https://js.api.here.com/v3/3.1/mapsjs.bundle.js";

let tmpl = document.createElement('template');
tmpl.innerHTML = `
        <style>
                *{
                font-size:1em;
                }
                
                .form-group{
                    width:100%;
                    height:72px;
                    display:flex;
                    box-shadow:0px 10px 10px 10px rgba(0,0,0,0.05);
                }   
                .form-group:focus, .form-control:active{
                    border:none;
                    border-radius:0px;
                }
                .form-control{
                    width:80%;
                    min-height:40px;
                    padding: 1em 2em;
                    border:none;
                    background-color:#fff;
                    border-radius:0px;
                }
                .form-control:focus, .form-control:active{
                    border:none;
                    border-radius:0px;
                }
                button{
                    border:none;
                    background: var(--button-bg, #eee);
                    border-radius:0px;
                    width:20%;
                }
                button:hover{
                    border:none;
                    background: var(--button-hover-bg, #ddd);
                    border-radius:0px;
                }
                button:active{
                    border:none;
                    border-radius:0px;
                }
                @media(max-width:375px){
                     button{
                         width:30%;
                     }
                    .form-control{
                        width:70%;
                    }
                
                }
                @media(max-width:270px){
                    button{
                        width:40%;
                    }
                    .form-control{
                        width:60%;
                    }
                
                }
        </style>
        <div class="form-group">
        <input id="input" class="form-control" placeholder="Startpunkt">
        <button type="submit" id="button">Route starten</button>
        </div>`;

class MapRoute extends HTMLElement {

    constructor() {
        super();
        console.log("Anfahrt Component registered!");
        let height = this.offsetHeight - 72;
        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = `
            <style>
            :host{
            width:100%;
            position:relative;
            z-index:1
            }
            #mapContainer{
            width:100%;
            height:` + height + `px;
            position:relative;
            z-index:-1;
            }
            map-input{
            z-index:1000;
            }
            </style>
            <link rel="stylesheet" type="text/css" href="https://js.api.here.com/v3/3.1/mapsjs-ui.css" />
            <map-input origin=` + this.origin + `></map-input>
            <div id="mapContainer"></div>`;

    }

    static get observedAttributes() {
        return ['origin', 'destination'];
    }

    get origin() {
        return this.getAttribute('origin');
    }
    set origin(val) {
        this.setAttribute('origin', val);
    }
    get destination() {
        return this.getAttribute('destination');
    }
    get apikey(){
        return this.getAttribute('apikey');
    }
    get markerIcon(){
        return this.getAttribute('markerIcon');
    }
    get lineColor(){
        return this.getAttribute('lineColor');
    }
    get uiLayer(){
        return this.hasAttribute('uiLayer');
    }
    get mapLayer(){
        if(this.getAttribute('mapLayer')=="Satellite"){
            return "satellite";
        }else{
            return "normal";
        }
    }

    connectedCallback(){

        if(!this.origin){
            let att = document.createAttribute('origin');
            att.value = " ";
            this.setAttributeNode(att);
        }

        var platform = new H.service.Platform({
            'apikey': this.apikey
        });
        this.platform = platform;
        if(this.destination.trim()){
            let service = platform.getSearchService();
            service.geocode({
                q: this.destination
            }, (result) => {
                let center = result.items[0].position;
                this.createMap(center);
            }, alert);
        }else{
            this.createMap();
        }
        this.addEventListener('map-input', e => this.origin = e.path[0].value);
    }

    handleInput(value){
        this.origin = value;
    }

    disconnectedCallback(){
        this.map.dispose();
    }

    createMap(centerPos){
        let platform = this.platform;
        // Retrieve the target element for the map:
        let targetElement = this.shadowRoot.getElementById("mapContainer");

        // Get the default map types from the platform object:
        let defaultLayers = platform.createDefaultLayers();


        // Instantiate the map:
        if(!centerPos){
            centerPos = {lat:52, lng: 8};
        }
        let type;
        if(this.mapLayer =="satellite"){
            type = defaultLayers.raster.satellite.map;
        }else{
            type = defaultLayers.vector.normal.map;
        }
        let map = new H.Map(this.shadowRoot.getElementById("mapContainer"),
            type,{
                zoom: 10,
                center: centerPos
            });
        this.map = map;


        if(this.uiLayer){
            var ui = H.ui.UI.createDefault(map, defaultLayers, "de-DE");
        }

        // Enable the event system on the map instance:
        var mapEvents = new H.mapevents.MapEvents(map);

        // Add event listeners:
        map.addEventListener('tap', function(evt) {
            // Log 'tap' and 'mouse' events:
            console.log(evt.type, evt.currentPointer.type);
        });

        // Instantiate the default behavior, providing the mapEvents object:
        var behavior = new H.mapevents.Behavior(mapEvents);


        this.drawRoute();

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "origin" && oldValue!=newValue && this.mapCreated()) {
            this.removeMapObjectById(oldValue);
            this.drawRoute();
        }else if(name==="destination" && oldValue!=newValue && this.mapCreated()) {
            this.removeMapObjectById(this.origin);
            this.drawRoute();
        }
    }

    mapCreated(){
        return this.platform && this.map;
    }
    removeMapObjectById(id){
        var map = this.map;
        for (let obj of map.getObjects()){
            if (obj.id===id){
                map.removeObject(obj);
            }
        }
    }

    drawRoute(){
        let map = this.map;
        let platform = this.platform;
        let dest = this.destination;
        let icon;
        if(this.markerIcon){
            icon = new H.map.Icon(this.markerIcon);
        }
        let lineColor;
        if(this.lineColor){
            lineColor = this.lineColor;
        }else{
            lineColor= 'black';
        }
        if(this.origin.trim()){
            let end;
            let adr = this.origin;
            let start;

            let routingParameters = {
                'routingMode': 'fast',
                'transportMode': 'car',
                // Include the route shape in the response
                'return': 'polyline'
            };

            // Define a callback function to process the routing response:
            let onResult = function(result) {
                // ensure that at least one route was found
                if (result.routes.length) {
                    result.routes[0].sections.forEach((section) => {
                        // Create a linestring to use as a point source for the route line
                        let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);

                        // Create a polyline to display the route:
                        let routeLine = new H.map.Polyline(linestring, {
                            style: { strokeColor: lineColor, lineWidth: 3 }
                        });
                        routeLine.id = adr;

                        // Create a marker for the start point:
                        let startMarker = new H.map.Marker(section.departure.place.location, {icon:icon});
                        startMarker.id = adr;

                        // Create a marker for the end point:
                        let endMarker = new H.map.Marker(section.arrival.place.location, {icon:icon});
                        endMarker.id = adr;

                        // Add the route polyline and the two markers to the map:
                        map.addObjects([routeLine, startMarker, endMarker]);

                        // Set the map's viewport to make the whole route visible:
                        map.getViewModel().setLookAtData({bounds: routeLine.getBoundingBox()});
                    });
                }
            };

            // Get an instance of the routing service version 8:
            let router = platform.getRoutingService(null, 8);

            let calculateRoute = () => {
                // Make sure that both destination and origin are present
                if (!start || !end) return;

                // Add origin and destination to the routing parameters
                routingParameters.origin = start;
                routingParameters.destination = end;
                router.calculateRoute(routingParameters, onResult, function(error) {alert(error.message);});
            }

            let service = platform.getSearchService();
            service.geocode({
                q: adr
            }, (result) => {
                if(result.items.length>0){
                    start = result.items[0].position.lat + ',' + result.items[0].position.lng;
                    calculateRoute();
                }else{
                    this.origin=" ";
                }
            }, alert);

            service.geocode({
                q: dest
            }, (result) => {
                end = result.items[0].position.lat + ',' + result.items[0].position.lng;
                calculateRoute();
            }, alert);

        }else if(this.destination.trim()){

            let goal;

            let makeMarker = () => {
                let endMarker = new H.map.Marker(goal,{icon:icon});
                endMarker.id = this.origin;
                map.addObject(endMarker);
                map.setCenter(goal);
            }

            let service = platform.getSearchService();
            service.geocode({
                q: dest
            }, (result) => {
                goal = result.items[0].position;
                makeMarker();
            }, alert);

        }
    }

}
window.customElements.define('map-route', MapRoute);

class MapInput extends HTMLElement {

    constructor() {
        super();
        console.log("Map-Input Component registered!");
        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(tmpl.content.cloneNode(true));

    }

    get origin() {
        return this.getAttribute('origin');
    }
    connectedCallback(){
        this.shadowRoot.querySelector("button").onclick = this.handleClick.bind(this);
        this.shadowRoot.querySelector("input").onkeypress = this.handleEnter.bind(this);
        if(this.origin){
            this.shadowRoot.querySelector("input").value = this.origin;
        }
    }
    handleEnter(e){
        if(e.key==="Enter"){
            this.handleClick();
        }
    }
    handleClick(){
        const input = this.shadowRoot.getElementById("input");
        input.dispatchEvent(new CustomEvent('map-input', {bubbles: true, composed: true}));
    }


}
window.customElements.define('map-input', MapInput);