# Customizable Attributes:

## Necessary

### destination
The destination cannot be set by the user!
The destination must always be set in the code, before the application is run.
If not only an empty map of the world will be displayed.

### style="height: ... px;"
The map-route component always needs to have a fixed height or the map won't display.

### apikey="YOUR_APIKEY"
The apikey is necessary for Here Maps. You will need to get a JavaScript Maps API key.
You can request this on the HERE website.

## Optional

### origin
If this is set, there will be a route displayed, before the  user puts anything in.
If this is not defined only the destination will be displayed, until the user puts in an origin.

### markerIcon
This will change the standard turquoise icon to a user-defined Icon. Datatypes can be png and svg.
The size can't be greater than 255x255px or the image will not be displayed.
Ideally the image should be even smaller between 30x30px and 60x60px. The path should be relative
to the position of the Component.

### mapLayer="normal"
If not set the map will always use the normal map view. If this attribute is set to "Satellite",
the map will first be displayed in satellite mode. The user can always change this if Map-Ui is turned on.

### uiLayer
If this attribute is present there will be Controls on the map to zoom in and out and to change
the map view to Satellite or normal Map View.

### lineColor
If this attribute is set, the lineColor of the route will be changed from black to the color you wish.
Possible attributes are all valid CSS-color attributes.

# CSS Styling:
To style the button of the input, you can define in your CSS the two variables --button-bg and
--button-hover-bg like so:
map-route{
  --button-bg: #c7d6c8;
  --button-hover-bg:#97b89a;
}
If these variables are not set, the standard gray button style will be applied.