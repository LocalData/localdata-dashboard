Map { background-color: rgba(0,0,0,0); }
#localdata['<%= key %>'='yes'] {
  [GEOMETRY = LineString] {
    line-width: 2;
    [zoom >= 15] {
      line-width: 4;
    }
    line-color: <%= colorYes %>;
    line-opacity: 0.85;
  }
  [GEOMETRY = Polygon],[GEOMETRY = MultiPolygon] {
    [zoom >= 14] {
      line-color: <%= colorYes %>;
      line-width:0.5;
      line-opacity:0.5;
    }
    polygon-fill: <%= colorYes %>;
    polygon-opacity:0.85;
  }
  [GEOMETRY=Point] {
    marker-line-width: 1;
    marker-width: <% if (pointSize !== undefined) { %> <%= pointSize * 2 / 3%> <% } else { %> 12 <% }%>;
    [zoom >= 16] {
      marker-line-width: 2;
      marker-width: <% if (pointSize !== undefined) { %> <%= pointSize %> <% } else { %> 18 <% }%>;
    }
    marker-type: ellipse;
    marker-line-color: <%= colorYes %>;
    marker-fill: <%= colorYes %>;
    marker-fill-opacity: 0.9;
    marker-line-opacity: 1;
  }
}

#localdata['<%= key %>'!='yes'] {
  [GEOMETRY = LineString] {
    line-width: 2;
    [zoom >= 15] {
      line-width: 4;
    }
    line-color: <%= colorNo %>;
    line-opacity: 0.85;
  }
  [GEOMETRY = Polygon],[GEOMETRY = MultiPolygon] {
    [zoom >= 14] {
      line-color: <%= colorNo %>;
      line-width:0.5;
      line-opacity:0.5;
    }
    polygon-fill: <%= colorNo %>;
    polygon-opacity:0.85;
  }
  [GEOMETRY=Point] {
    marker-line-width: 1;
    marker-width: <% if (pointSize !== undefined) { %> <%= pointSize * 2 / 3%> <% } else { %> 12 <% }%>;
    [zoom >= 16] {
      marker-line-width: 2;
      marker-width: <% if (pointSize !== undefined) { %> <%= pointSize %> <% } else { %> 18 <% }%>;
    }
    marker-type: ellipse;
    marker-line-color: <%= colorNo %>;
    marker-fill: <%= colorNo %>;
    marker-fill-opacity: 0.9;
    marker-line-opacity: 1;
  }
}
