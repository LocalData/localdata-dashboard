Map { background-color: rgba(0,0,0,0); }
#localdata {
  [zoom >= 14] {
    line-color: <%= color %>;
    line-width:0.5;
    line-opacity:0.5;
  }
  polygon-fill: <%= color %>;
  polygon-opacity:0.85;
}