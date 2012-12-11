/*jslint nomen: true */
/*globals define: true */

define(function (require) {
  'use strict';
  var questions = [
    {
    "name": "structure",
    "text": "Is there a structure on the site?",
    "info": "<p>Structure does not include a shed or garage.  For instance, a community garden has a shed. For the purposes of this survey, this is a site with no structure .</p>",
    "answers": [
      {
      "value": "yes",
      "text": "Yes",
      "questions": [
        {
        "name": "structure-properties",
        "text": "Do any of the following apply? (Check all that apply)",
        "info": "<p><strong>Fire-damaged</strong>: Structure has smoke or fire damage visible from exterior of structure</p>  <p><strong>Vacant, Open, and Dangerous (VOD)</strong>: Structure has a missing or broken window, door, or other point of entry. If the structure has been boarded, and no points of entry remain open,  it is NOT VOD</p>",
        "type": "checkbox",
        "answers": [
          {
          "name": "under-construction",
          "value": "yes",
          "text": "Property is under construction"
        },
        {
          "name": "fire-damage",
          "value": "yes",
          "text": "The structure appears to be fire-damaged"
        },
        {
          "name": "vod",
          "value": "yes",
          "text": "The structure appears to be vacant, open, and dangerous",
          "questions": [
            {
            "name": "vacant-property-details",
            "value": "",
            "text": "Vacant property details:",
            "type": "checkbox",
            "answers": [
              {
              "name": "boarding-needed",
              "value": "yes",
              "text": "The structure needs to be boarded"
            },
            {
              "name": "grass-needs-cut",
              "value": "yes",
              "text": "The grass needs to be cut"
            },
            {
              "name": "dumping",
              "value": "yes",
              "text": "The lot needs to be cleared of dumped materials or debris piles"
            }
            ]
          }
          ]
        },
        {
          "name": "structure-none-of-above",
          "value": "yes",
          "text": "None of the above"
        }
        ]
      },
      {
        "name": "in-use",
        "text": "Does the structure appear to be in use?",
        "answers": [
          {
          "value": "yes",
          "text": "Yes"
        },
        {
          "value": "unknown",
          "text": "Unknown"
        },
        {
          "value": "no",
          "text": "No"
        }
        ]
      },
      {
        "name": "use",
        "text": "What is the primary use of the structure?",
        "info": "<p>What is the primary intended use of the building? Whether or not it is occupied, what is the primary purpose that the building is set up to be used for?</p>",
        "answers": [
          {
          "value": "residential",
          "text": "Residential",
          "title": "Residential properties:",
          "questions": [
            {
            "name": "units",
            "text": "How many units does this residential structure appear to have?",
            "answers": [
              {
              "value": "1",
              "text": "1 unit"
            },
            {
              "value": "2",
              "text": "2 units"
            },
            {
              "value": "3-4",
              "text": "3-4 units"
            },
            {
              "value": "5-10",
              "text": "5-10 units"
            },
            {
              "value": "10+",
              "text": "More than 10 units"
            },
            {
              "value": "condo-parcel",
              "text": "Condo parcel, part of multiple-unit building"
            }
            ]
          },
          {
            "name": "condition",
            "text": "What is the general condition of the structure?",
            "info": " <p><strong>Excellent:</strong> Structurally sound No major or minor repairs needed</p> <p><strong>Good:</strong> Structurally sound No major repairs needed No more than two minor repairs needed</p> <p><strong>Fair:</strong> Structurally sound Up to one major repair needed, or Three or more minor repairs needed Property can still be rehabbed without major reconstruction</p> <p><strong>Poor:</strong> May not be structurally sound More than one major repair needed Most or all areas of minor repairs need attention Property can be rehabbed with much larger investment</p> <p><strong>Needs Demolition:</strong> Not structurally sound Property cannot be rehabbed without almost total reconstruction</p>",
            "answers": [
              {
              "value": "excellent",
              "text": "Excellent"
            },
            {
              "value": "good",
              "text": "Good"
            },
            {
              "value": "fair",
              "text": "Fair"
            },
            {
              "value": "poor",
              "text": "Poor"
            },
            {
              "value": "needs-demolition",
              "text": "Needs demolition"
            }
            ]
          },
          {
            "name": "occupancy",
            "text": "What is the building's occupancy status?",
            "answers": [
              {
              "value": "Occupied",
              "text": "Occupied"
            },
            {
              "value": "Likely occupied",
              "text": "Likely occupied"
            },
            {
              "value": "Unknown",
              "text": "Unknown"
            },
            {
              "value": "Likely vacancy",
              "text": "Likely vacancy"
            },
            {
              "value": "Vacant",
              "text": "Vacant"
            }
            ]
          }
          ]
        },
        {
          "value": "commercial",
          "text": "Commercial",
          "questions": [
            {
            "name": "condition-commercial",
            "text": "What is the general condition of the structure?",
            "answers": [
              {
              "value": "good",
              "text": "Good"
            },
            {
              "value": "fair",
              "text": "Fair"
            },
            {
              "value": "poor",
              "text": "Poor"
            },
            {
              "value": "needs-demolition",
              "text": "Needs demolition"
            }
            ]
          },
          {
            "name": "storefront-condition",
            "text": "What is the general condition of the storefront and/or lot?",
            "type": "checkbox",
            "answers": [
              {
              "name": "signage-attractive",
              "value": "yes",
              "text": "Attractive"
            },
            {
              "name": "signage-clear",
              "value": "yes",
              "text": "Signage is clear and inviting"
            },
            {
              "name": "signage-needs-work",
              "value": "yes",
              "text": "Needs minimal work"
            },
            {
              "name": "signage-needs-attention",
              "value": "yes",
              "text": "Needs serious attention to make attractive and inviting"
            }
            ]
          },
          {
            "name": "commercial-units",
            "text": "Approximately how many commercial units are in the building?",
            "answers": [
              {
              "value": "1",
              "text": "Only one"
            },
            {
              "value": "2-3",
              "text": "2-3"
            },
            {
              "value": "4+",
              "text": "4 or more"
            }
            ]
          },
          {
            "name": "commercial-use",
            "text": "What are the primary types of active commercial found in the building?",
            "type": "checkbox",
            "answers": [
              {
              "name": "use-office",
              "value": "use-office",
              "text": "Office Building"
            },
            {
              "name": "use-grocery",
              "value": "use-grocery",
              "text": "Grocery",
              "questions": [
                {
                "name": "use-grocery-detail",
                "text": "Detailed grocery use",
                "type": "checkbox",
                "answers": [
                  {
                  "name": "grocery-full-service",
                  "value": "yes",
                  "text": "Full service grocery"
                },
                {
                  "name": "grocery-quick",
                  "value": "yes",
                  "text": "Quick mart"
                }
                ]
              }
              ]
            },
            {
              "name": "use-retail",
              "value": "use-retail",
              "text": "Other Retail",
              "questions": [
                {
                "name": "use-retail-detail",
                "text": "Detailed retail use",
                "type": "checkbox",
                "answers": [
                  {
                  "name": "retail-apparel",
                  "value": "yes",
                  "text": "Apparel (clothing / shoes)"
                },
                {
                  "name": "retail-hardware",
                  "value": "yes",
                  "text": "Hardware"
                },
                {
                  "name": "retail-homegoods",
                  "value": "yes",
                  "text": "Home goods"
                },
                {
                  "name": "retail-personalcare",
                  "value": "yes",
                  "text": "Personal Care Goods"
                },
                {
                  "name": "retail-dollar-store",
                  "value": "yes",
                  "text": "Dollar Store"
                },
                {
                  "name": "retail-other",
                  "value": "yes",
                  "text": "Other"
                }
                ]
              }
              ]
            },
            {
              "name": "use-services",
              "value": "use-services",
              "text": "Services",
              "questions": [
                {
                "name": "use-service-detail",
                "text": "Detailed service use",
                "type": "checkbox",
                "answers": [
                  {
                  "name": "service-hair",
                  "value": "yes",
                  "text": "Hair salon, barber shop, nail salon"
                },
                {
                  "name": "service-financial",
                  "value": "yes",
                  "text": "Financial services"
                },
                {
                  "name": "service-hotel-motel",
                  "value": "yes",
                  "text": "Hotel / motel"
                },
                {
                  "name": "service-car",
                  "value": "yes",
                  "text": "Car / motor services"
                },
                {
                  "name": "service-healthcare",
                  "value": "yes",
                  "text": "Healthcare services"
                },
                {
                  "name": "service-drycleaner",
                  "value": "yes",
                  "text": "Dry cleaner / laundromat"
                },
                {
                  "name": "service-other",
                  "value": "yes",
                  "text": "Other"
                }
                ]
              }
              ]
            },
            {
              "name": "use-entertainment",
              "value": "use-entertainment",
              "text": "Entertainment",
              "questions": [
                {
                "name": "use-entertainment-detail",
                "text": "Detailed entertainment use",
                "type": "checkbox",
                "answers": [
                  {
                  "name": "entertainment-general",
                  "value": "yes",
                  "text": "General entertainment"
                },
                {
                  "name": "entertainment-adult",
                  "value": "yes",
                  "text": "Adult entertainment"
                }
                ]
              }
              ]
            },
            {
              "name": "use-food",
              "value": "use-food",
              "text": "Food",
              "questions": [
                {
                "name": "use-food-detail",
                "text": "Detailed food services use",
                "type": "checkbox",
                "answers": [
                  {
                  "name": "food-sitdown",
                  "value": "yes",
                  "text": "Restaurant (sit-down)"
                },
                {
                  "name": "food-takeout",
                  "value": "yes",
                  "text": "Restaurant (take-out, without seating)"
                },
                {
                  "name": "food-bar",
                  "value": "yes",
                  "text": "Bar (with or without food)"
                }
                ]
              }
              ]
            }
            ]
          }
          ]
        },
        {
          "value": "industrial",
          "text": "Industrial",
          "questions": [
            {
            "name": "condition-industrial",
            "text": "What is the general condition of the structure?",
            "answers": [
              {
              "value": "good",
              "text": "Good"
            },
            {
              "value": "fair",
              "text": "Fair"
            },
            {
              "value": "poor",
              "text": "Poor"
            },
            {
              "value": "needs-demolition",
              "text": "Needs demolition"
            }
            ]
          },
          {
            "name": "industrial-detailed-use",
            "text": "What is the detailed use type?",
            "answers": [
              {
              "value": "automotive",
              "text": "Automotive"
            },
            {
              "value": "heavy",
              "text": "Heavy industrial"
            },
            {
              "value": "light",
              "text": "Light industrial"
            }
            ]
          }
          ]
        },
        {
          "value": "other",
          "text": "Institutional, recreational, or other use",
          "questions": [
            {
            "name": "condition-institutional",
            "text": "What is the general condition of the structure?",
            "answers": [
              {
              "value": "good",
              "text": "Good"
            },
            {
              "value": "fair",
              "text": "Fair"
            },
            {
              "value": "poor",
              "text": "Poor"
            },
            {
              "value": "needs-demolition",
              "text": "Needs demolition"
            }
            ]
          },
          {
            "name": "detailed-use",
            "text": "Detailed use:",
            "answers": [
              {
              "value": "governmental",
              "text": "Governmental"
            },
            {
              "value": "educational",
              "text": "Educational"
            },
            {
              "value": "hospital",
              "text": "Hospital"
            },
            {
              "value": "religious",
              "text": "Religious"
            },
            {
              "value": "infrastructure",
              "text": "Infrastructure / City services"
            },
            {
              "value": "park",
              "text": "Park with park structure"
            },
            {
              "value": "other",
              "text": "Other"
            }
            ]
          }
          ]
        }
        ]
      },
      {
        "name": "multiple-uses-check",
        "text": "",
        "answers": [
          {
          "name": "multiple-uses",
          "value": "yes",
          "text": "This parcel has multiple uses",
          "repeatQuestions": "true",
          "questions": [
            {
            "name": "use",
            "text": "Add another use:",
            "answers": [
              {
              "value": "residential",
              "text": "Residential",
              "title": "Residential properties:",
              "questions": [
                {
                "name": "units",
                "text": "How many units does this residential structure appear to have?",
                "answers": [
                  {
                  "value": "1",
                  "text": "1 unit"
                },
                {
                  "value": "2",
                  "text": "2 units"
                },
                {
                  "value": "3-4",
                  "text": "3-4 units"
                },
                {
                  "value": "5-10",
                  "text": "5-10 units"
                },
                {
                  "value": "10+",
                  "text": "More than 10 units"
                },
                {
                  "value": "condo-parcel",
                  "text": "Condo parcel, part of multiple-unit building"
                }
                ]
              },
              {
                "name": "occupancy",
                "text": "What is the building's occupancy status?",
                "answers": [
                  {
                  "value": "Occupied",
                  "text": "Occupied"
                },
                {
                  "value": "Likely occupied",
                  "text": "Likely occupied"
                },
                {
                  "value": "Unknown",
                  "text": "Unknown"
                },
                {
                  "value": "Likely vacancy",
                  "text": "Likely vacancy"
                },
                {
                  "value": "Vacant",
                  "text": "Vacant"
                }
                ]
              }
              ]
            },
            {
              "value": "commercial",
              "text": "Commercial",
              "questions": [
                {
                "name": "condition-commercial",
                "text": "What is the general condition of the structure?",
                "answers": [
                  {
                  "value": "good",
                  "text": "Good"
                },
                {
                  "value": "fair",
                  "text": "Fair"
                },
                {
                  "value": "poor",
                  "text": "Poor"
                },
                {
                  "value": "needs-demolition",
                  "text": "Needs demolition"
                }
                ]
              },
              {
                "name": "storefront-condition",
                "text": "What is the general condition of the storefront and/or lot?",
                "type": "checkbox",
                "answers": [
                  {
                  "name": "signage-attractive",
                  "value": "yes",
                  "text": "Attractive"
                },
                {
                  "name": "signage-clear",
                  "value": "yes",
                  "text": "Signage is clear and inviting"
                },
                {
                  "name": "signage-needs-work",
                  "value": "yes",
                  "text": "Needs minimal work"
                },
                {
                  "name": "signage-needs-attention",
                  "value": "yes",
                  "text": "Needs serious attention to make attractive and inviting"
                }
                ]
              },
              {
                "name": "commercial-units",
                "text": "Approximately how many commercial units are in the building?",
                "answers": [
                  {
                  "value": "1",
                  "text": "Only one"
                },
                {
                  "value": "2-3",
                  "text": "2-3"
                },
                {
                  "value": "4+",
                  "text": "4 or more"
                }
                ]
              },
              {
                "name": "commercial-use",
                "text": "What are the primary types of active commercial found in the building?",
                "type": "checkbox",
                "answers": [
                  {
                  "name": "use-office",
                  "value": "use-office",
                  "text": "Office Building"
                },
                {
                  "name": "use-grocery",
                  "value": "use-grocery",
                  "text": "Grocery",
                  "questions": [
                    {
                    "name": "use-grocery-detail",
                    "text": "Detailed grocery use",
                    "type": "checkbox",
                    "answers": [
                      {
                      "name": "grocery-full-service",
                      "value": "yes",
                      "text": "Full service grocery"
                    },
                    {
                      "name": "grocery-quick",
                      "value": "yes",
                      "text": "Quick mart"
                    }
                    ]
                  }
                  ]
                },
                {
                  "name": "use-retail",
                  "value": "use-retail",
                  "text": "Other Retail",
                  "questions": [
                    {
                    "name": "use-retail-detail",
                    "text": "Detailed retail use",
                    "type": "checkbox",
                    "answers": [
                      {
                      "name": "retail-apparel",
                      "value": "yes",
                      "text": "Apparel (clothing / shoes)"
                    },
                    {
                      "name": "retail-hardware",
                      "value": "yes",
                      "text": "Hardware"
                    },
                    {
                      "name": "retail-homegoods",
                      "value": "yes",
                      "text": "Home goods"
                    },
                    {
                      "name": "retail-personalcare",
                      "value": "yes",
                      "text": "Personal Care Goods"
                    },
                    {
                      "name": "retail-dollar-store",
                      "value": "yes",
                      "text": "Dollar Store"
                    },
                    {
                      "name": "retail-other",
                      "value": "yes",
                      "text": "Other"
                    }
                    ]
                  }
                  ]
                },
                {
                  "name": "use-services",
                  "value": "use-services",
                  "text": "Services",
                  "questions": [
                    {
                    "name": "use-service-detail",
                    "text": "Detailed service use",
                    "type": "checkbox",
                    "answers": [
                      {
                      "name": "service-hair",
                      "value": "yes",
                      "text": "Hair salon, barber shop, nail salon"
                    },
                    {
                      "name": "service-financial",
                      "value": "yes",
                      "text": "Financial services"
                    },
                    {
                      "name": "service-hotel-motel",
                      "value": "yes",
                      "text": "Hotel / motel"
                    },
                    {
                      "name": "service-car",
                      "value": "yes",
                      "text": "Car / motor services"
                    },
                    {
                      "name": "service-healthcare",
                      "value": "yes",
                      "text": "Healthcare services"
                    },
                    {
                      "name": "service-drycleaner",
                      "value": "yes",
                      "text": "Dry cleaner / laundromat"
                    },
                    {
                      "name": "service-other",
                      "value": "yes",
                      "text": "Other"
                    }
                    ]
                  }
                  ]
                },
                {
                  "name": "use-entertainment",
                  "value": "use-entertainment",
                  "text": "Entertainment",
                  "questions": [
                    {
                    "name": "use-entertainment-detail",
                    "text": "Detailed entertainment use",
                    "type": "checkbox",
                    "answers": [
                      {
                      "name": "entertainment-general",
                      "value": "yes",
                      "text": "General entertainment"
                    },
                    {
                      "name": "entertainment-adult",
                      "value": "yes",
                      "text": "Adult entertainment"
                    }
                    ]
                  }
                  ]
                },
                {
                  "name": "use-food",
                  "value": "use-food",
                  "text": "Food",
                  "questions": [
                    {
                    "name": "use-food-detail",
                    "text": "Detailed food services use",
                    "type": "checkbox",
                    "answers": [
                      {
                      "name": "food-sitdown",
                      "value": "yes",
                      "text": "Restaurant (sit-down)"
                    },
                    {
                      "name": "food-takeout",
                      "value": "yes",
                      "text": "Restaurant (take-out, without seating)"
                    },
                    {
                      "name": "food-bar",
                      "value": "yes",
                      "text": "Bar (with or without food)"
                    }
                    ]
                  }
                  ]
                }
                ]
              }
              ]
            },
            {
              "value": "industrial",
              "text": "Industrial",
              "questions": [
                {
                "name": "condition-industrial",
                "text": "What is the general condition of the structure?",
                "answers": [
                  {
                  "value": "good",
                  "text": "Good"
                },
                {
                  "value": "fair",
                  "text": "Fair"
                },
                {
                  "value": "poor",
                  "text": "Poor"
                },
                {
                  "value": "needs-demolition",
                  "text": "Needs demolition"
                }
                ]
              },
              {
                "name": "industrial-detailed-use",
                "text": "What is the detailed use type?",
                "answers": [
                  {
                  "value": "automotive",
                  "text": "Automotive"
                },
                {
                  "value": "heavy",
                  "text": "Heavy industrial"
                },
                {
                  "value": "light",
                  "text": "Light industrial"
                }
                ]
              }
              ]
            },
            {
              "value": "other",
              "text": "Institutional, recreational, or other use",
              "questions": [
                {
                "name": "condition-institutional",
                "text": "What is the general condition of the structure?",
                "answers": [
                  {
                  "value": "good",
                  "text": "Good"
                },
                {
                  "value": "fair",
                  "text": "Fair"
                },
                {
                  "value": "poor",
                  "text": "Poor"
                },
                {
                  "value": "needs-demolition",
                  "text": "Needs demolition"
                }
                ]
              },
              {
                "name": "detailed-use",
                "text": "Detailed use:",
                "answers": [
                  {
                  "value": "governmental",
                  "text": "Governmental"
                },
                {
                  "value": "educational",
                  "text": "Educational"
                },
                {
                  "value": "hospital",
                  "text": "Hospital"
                },
                {
                  "value": "religious",
                  "text": "Religious"
                },
                {
                  "value": "infrastructure",
                  "text": "Infrastructure / City services"
                },
                {
                  "value": "park",
                  "text": "Park with park structure"
                },
                {
                  "value": "other",
                  "text": "Other"
                }
                ]
              }
              ]
            }
            ]
          }
          ]
        }
        ]
      },
      {
        "name": "asset-close",
        "value": "asset-close",
        "text": "Is the property in close proximity to any community assets?",
        "type": "text",
        "answers": [
          {
          "name": "nearby-asset",
          "value": "",
          "text": "If so, what is the name of the community asset?"
        }
        ]
      }
      ]
    },
    {
      "value": "no",
      "text": "No",
      "questions": [
        {
        "name": "maintenance",
        "text": "Is the lot maintained?",
        "answers": [
          {
          "value": "maintained",
          "text": "Yes, it's maintained"
        },
        {
          "value": "unmaintained",
          "text": "No, it's unmaintained"
        }
        ]
      },
      {
        "name": "no-structure",
        "text": "Does the lot appear to have the following? (Check all that apply)",
        "type": "checkbox",
        "answers": [
          {
          "name": "dumping",
          "value": "yes",
          "text": "Illegal dumping on site"
        },
        {
          "name": "parking-or-storage",
          "value": "yes",
          "text": "Parking or storage on site"
        },
        {
          "name": "garden",
          "value": "yes",
          "text": "A garden on site"
        },
        {
          "name": "park",
          "value": "yes",
          "text": "Site is a park (formal or informal)"
        },
        {
          "name": "no-structure-none-of-above",
          "value": "yes",
          "text": "None of the above"
        }
        ]
      }
      ]
    }
    ]
  }
  ];

  return questions;
});

