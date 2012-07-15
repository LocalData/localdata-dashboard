NSB.templates['home'] = _.template("\
<div id='modal-list-surveys'>\
  <h1>Surveys</h1>\
  <% _.each(surveys, function(d) { %>\
      <h2><a href='#survey/<%= d.id %>'><%= d.name %></a> </h2>\
  <% }); %>\
</div>\
");
