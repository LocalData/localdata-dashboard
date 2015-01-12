Map {
background-color: rgba(0,0,0,0);
}
 
<% if (showNoResponse) { %>
#localdata {
  [GEOMETRY = LineString],[GEOMETRY = MultiLineString] {
    line-width: 2;
    [zoom >= 15] {
      line-width: 4;
    }
    line-color: #b7aba5;
    line-opacity: 0.85;
  }
  [GEOMETRY = Polygon],[GEOMETRY = MultiPolygon] {
    [zoom >= 14] {
      line-color: #b7aba5;
      line-width:0.5;
      line-opacity:0.5;
    }
    polygon-fill: #b7aba5;
    polygon-opacity:0.85;
  }
  [GEOMETRY = Point] {
    marker-line-width: 1;
    marker-width: <%= pointSize * 2 / 3 %>;
    [zoom >= 16] {
      marker-line-width: 4;
      marker-width: <%= pointSize %>;
    }
    marker-type: ellipse;
    marker-line-color: #b7aba5;
    marker-fill: #b7aba5;
    marker-fill-opacity: 0.9;
    marker-line-opacity: 1;
  }
}
<% } %>
 
<% for (var i = 0; i < pairs.length; i++) { %>
<% var pair = pairs[i]; %>
#localdata['<%= pair.key %>'='<%= pair.value %>'] {
  [GEOMETRY = LineString],[GEOMETRY = MultiLineString] {
    line-width: 2;
    [zoom >= 15] {
      line-width: 4;
    }
    line-color: <%= pair.color %>;
    line-opacity: 0.85;
  }
  [GEOMETRY = Polygon],[GEOMETRY = MultiPolygon] {
    [zoom >= 14] {
      line-color: <%= pair.color %>;
      line-width:0.5;
      line-opacity:0.5;
    }
    polygon-fill: <%= pair.color %>;
    polygon-opacity:0.85;
  }
  [GEOMETRY = Point] {
    marker-line-width: 1;
    marker-width: <%= pointSize * 2 / 3 %>;
    [zoom >= 16] {
      marker-line-width: 2;
      marker-width: <%= pointSize %>;
    }
    marker-type: ellipse;
    marker-line-color: <%= pair.color %>;
    marker-fill: <%= pair.color %>;
    marker-fill-opacity: 0.9;
    marker-line-opacity: 1;
  }
}
<% } %>
