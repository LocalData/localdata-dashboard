Map {
background-color: rgba(0,0,0,0);
}
 
<% if (showNoResponse) { %>
#localdata {
  [zoom >= 14] {
    line-color: #b7aba5;
    line-width:0.5;
    line-opacity:0.5;
  }
  polygon-fill: #b7aba5;
  polygon-opacity:0.85;
}
<% } %>
 
<% for (var i = 0; i < pairs.length; i++) { %>
<% var pair = pairs[i]; %>
#localdata['<%= pair.key %>'='<%= pair.value %>'] {
  [zoom >= 14] {
    line-color: <%= pair.color %>;
    line-width:0.5;
    line-opacity:0.5;
  }
  polygon-fill: <%= pair.color %>;
  polygon-opacity:0.85;
}
<% } %>