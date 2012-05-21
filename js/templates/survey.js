NSB.templates['survey_view'] = _.template("\
  <h2><%= survey.name %> </h2>\
  <ul class='nav nav-tabs'>\
    <li class='active'>\
      <a href='#survey/<%= survey.id %>'>Results</a>\
    </li>\
    <li>\
      <a href='upload'>Upload scanned results</a>\
    </li>\
    <li>\
      <a href='#survey/<%= survey.id %>/export'>Export</a>\
    </li>\
  </ul>\
  \
  <table class='table table-condensed'>\
    <thead>\
      <tr>\
        <th>Collector</th>\
        <th>Parcel ID</th>\
        <th>Created</th>\
        <th>Responses</th>\
      </tr>\
    </thead>\
    <tbody>\
      <% for (var i = 0; i < responses.length; i++) { %>\
      <tr>\
        <% var response = responses[i]; %>\
        <td><strong><%= response.source.collector %></strong></td>\
        <td><%= response.parcel_id %></td>\
        <% var date = new Date(response.created); %>\
        <td><%= date %></td>\
        <td><%= JSON.stringify(response.responses) %></td>\
      </tr>\
      <% }; %>\
    </tbody>\
  </table>\
");


NSB.templates['export_view'] = _.template("\
  <h2><%= survey.name %> </h2>\
  <ul class='nav nav-tabs'>\
    <li>\
      <a href='#survey/<%= survey.id %>'>Results</a>\
    </li>\
    <li>\
      <a href='upload'>Upload scanned results</a>\
    </li>\
    <li class='active'>\
      <a href='#survey/<%= survey.id %>/export'>Export</a>\
    </li>\
  </ul>\
  \
");