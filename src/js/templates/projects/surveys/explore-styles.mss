Map {
background-color: rgba(0,0,0,0);
}

<% if (showNoResponse) { %>
<% var color = '#b7aba5'; %>

<% for (var i = 0; i < pairs.length; i++) { %>
  <% var pair = pairs[i]; %>
  <% if(pair.value === 'no response') { %>
    <% color = pair.color; %>
  <% } %>
<% } %>

#localdata {
  [GEOMETRY = LineString],[GEOMETRY = MultiLineString] {
    line-width: 2;
    [zoom >= 15] {
      line-width: 5;
    }
    [zoom >= 16] {
      line-width: 7;
    }
    [zoom >= 18] {
      line-width: 9;
    }
    line-color: <%= color %>;
    line-opacity: 1;
  }
  [GEOMETRY = Polygon],[GEOMETRY = MultiPolygon] {
    [zoom >= 14] {
      line-color: <%= color %>;
      line-width:0.5;
      line-opacity:0.5;
    }
    polygon-fill: <%= color %>;
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
    marker-line-color: <%= color %>;
    marker-fill: <%= color %>;
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
      line-width: 5;
    }
    [zoom >= 16] {
      line-width: 7;
    }
    [zoom >= 18] {
      line-width: 9;
    }
    line-color: <%= pair.color %>;
    line-opacity: 1;
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
