/* =========================================================
   TURİSTİK İŞARƏLƏNMƏ SİSTEMİ
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://yqvbilayejhwimtjcbsl.supabase.co";


/*
  BURADA ƏVVƏL İŞLƏYƏN PUBLISHABLE KEY-İNİ SAXLA.

  Secret key / sb_secret istifadə etmə.
*/

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_h9izqUrMMLQ3cepK8Zlv4g_FGgCxWPc";


const SUPABASE_TABLE =
  "signage_records";


/* =========================================================
   SYSTEMS
========================================================= */

const systems = {

  mountain: {

    az:
      "Dağ piyada işarələnməsi",

    en:
      "Mountain Hiking Signage",

    descriptionAz:
      "Dağ və təbiət ərazilərində piyada marşrutlarının işarələnməsi.",

    descriptionEn:
      "Signage for hiking routes in mountainous and natural areas."

  },

  pedestrian: {

    az:
      "Piyada və yol işarələnməsi",

    en:
      "Pedestrian & Road Signage",

    descriptionAz:
      "Piyada hərəkəti və yol istiqamətləndirilməsi üçün turistik işarələnmə.",

    descriptionEn:
      "Tourist signage for pedestrian movement and road guidance."

  }

};


/* =========================================================
   CORRIDORS
========================================================= */

const routes = {

  bakuAbsheron: {

    number:"01",

    az:
      "Bakı-Abşeron dəhlizi",

    en:
      "Baku-Absheron Corridor"

  },

  north: {

    number:"02",

    az:
      "Şimal dəhlizi",

    en:
      "Northern Corridor"

  },

  northwest: {

    number:"03",

    az:
      "Şimal-Qərb dəhlizi",

    en:
      "North-Western Corridor"

  },

  west: {

    number:"04",

    az:
      "Qərb dəhlizi",

    en:
      "Western Corridor"

  },

  south: {

    number:"05",

    az:
      "Cənub dəhlizi",

    en:
      "Southern Corridor"

  },

  southwest: {

    number:"06",

    az:
      "Cənub-Qərb dəhlizi",

    en:
      "South-Western Corridor"

  },

  nakhchivan: {

    number:"07",

    az:
      "Naxçıvan MR",

    en:
      "Nakhchivan AR"

  }

};


/* =========================================================
   STATUS
========================================================= */

const statuses = {

  inPlace: {

    az:"Yerindədir",

    en:"In Place"

  },

  damaged: {

    az:"Zədəlidir",

    en:"Damaged"

  },

  missing: {

    az:"Yerində deyil",

    en:"Missing"

  }

};


/* =========================================================
   STATE
========================================================= */

let database =
  createDatabase();


let currentSystem =
  "mountain";


let currentRoute =
  "bakuAbsheron";


let currentLanguage =
  "az";


let editingId =
  null;


let draggedId =
  null;


let toastTimer =
  null;


/* =========================================================
   DATABASE STRUCTURE
========================================================= */

function createDatabase() {

  return {

    mountain: {

      bakuAbsheron:[],
      north:[],
      northwest:[],
      west:[],
      south:[],
      southwest:[],
      nakhchivan:[]

    },

    pedestrian: {

      bakuAbsheron:[],
      north:[],
      northwest:[],
      west:[],
      south:[],
      southwest:[],
      nakhchivan:[]

    }

  };

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


/* =========================================================
   NORMALIZE RECORD
========================================================= */

function normalizeRecord(row) {

  return {

    id:
      row.id,

    masterCode:
      row.master_code || "",

    signType:
      row.sign_type || "",

    region:
      row.region || "",

    gps:
      row.gps || "",

    imageLink:
      row.image_link || "",

    status:
      statuses[row.status]
        ? row.status
        : "inPlace",

    note:
      row.note || "",

    sortOrder:
      row.sort_order === null ||
      row.sort_order === undefined
        ? 999999
        : Number(row.sort_order),

    createdAt:
      row.created_at || ""

  };

}


/* =========================================================
   SORT
========================================================= */

function sortRecords(records) {

  return [...records].sort(
    (a,b) => {

      const aOrder =
        Number.isFinite(a.sortOrder)
          ? a.sortOrder
          : 999999;


      const bOrder =
        Number.isFinite(b.sortOrder)
          ? b.sortOrder
          : 999999;


      if(aOrder !== bOrder) {

        return aOrder - bOrder;

      }


      return String(
        a.createdAt
      ).localeCompare(
        String(b.createdAt)
      );

    }
  );

}


/* =========================================================
   SUPABASE REQUEST
========================================================= */

async function supabaseRequest(
  endpoint,
  options={}
) {

  if(
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY.includes(
      "BURAYA"
    )
  ) {

    throw new Error(
      "Publishable key daxil edilməyib."
    );

  }


  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/${endpoint}`,
      {

        ...options,

        headers:{

          "apikey":
            SUPABASE_PUBLISHABLE_KEY,

          "Authorization":
            `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,

          "Content-Type":
            "application/json",

          ...(options.headers || {})

        }

      }
    );


  if(!response.ok) {

    const error =
      await response.text();

    throw new Error(
      `${response.status}: ${error}`
    );

  }


  if(response.status === 204) {

    return null;

  }


  const text =
    await response.text();


  return text
    ? JSON.parse(text)
    : null;

}


/* =========================================================
   LOAD DATABASE
========================================================= */

async function loadDatabase() {

  database =
    createDatabase();


  const rows =
    await supabaseRequest(
      `${SUPABASE_TABLE}?select=*&order=sort_order.asc.nullslast,created_at.asc`
    );


  (rows || []).forEach(
    row => {

      const system =
        row.system_id;


      const corridor =
        row.corridor_id;


      if(!database[system]) {

        return;

      }


      if(!database[system][corridor]) {

        return;

      }


      database[system][corridor]
        .push(
          normalizeRecord(row)
        );

    }
  );


  Object.keys(database)
    .forEach(
      system => {

        Object.keys(
          database[system]
        ).forEach(
          corridor => {

            database[system][corridor] =
              sortRecords(
                database[system][corridor]
              );

          }
        );

      }
    );

}


/* =========================================================
   INSERT
========================================================= */

async function insertRecord(record) {

  const records =
    database[
      currentSystem
    ][
      currentRoute
    ];


  const payload = {

    system_id:
      currentSystem,

    corridor_id:
      currentRoute,

    master_code:
      record.masterCode || null,

    sign_type:
      record.signType || null,

    region:
      record.region || null,

    gps:
      record.gps || null,

    image_link:
      record.imageLink || null,

    status:
      record.status || "inPlace",

    note:
      record.note || null,

    sort_order:
      records.length

  };


  const result =
    await supabaseRequest(
      SUPABASE_TABLE,
      {

        method:"POST",

        headers:{
          "Prefer":
            "return=representation"
        },

        body:
          JSON.stringify(payload)

      }
    );


  return normalizeRecord(
    result[0]
  );

}


/* =========================================================
   UPDATE
========================================================= */

async function updateRecord(
  id,
  record
) {

  const payload = {

    master_code:
      record.masterCode || null,

    sign_type:
      record.signType || null,

    region:
      record.region || null,

    gps:
      record.gps || null,

    image_link:
      record.imageLink || null,

    status:
      record.status || "inPlace",

    note:
      record.note || null,

    updated_at:
      new Date().toISOString()

  };


  await supabaseRequest(
    `${SUPABASE_TABLE}?id=eq.${encodeURIComponent(id)}`,
    {

      method:"PATCH",

      body:
        JSON.stringify(payload)

    }
  );

}


/* =========================================================
   DELETE
========================================================= */

async function deleteRecord(id) {

  await supabaseRequest(
    `${SUPABASE_TABLE}?id=eq.${encodeURIComponent(id)}`,
    {

      method:"DELETE"

    }
  );

}


/* =========================================================
   SAVE ORDER
========================================================= */

async function saveOrder() {

  const records =
    database[
      currentSystem
    ][
      currentRoute
    ];


  for(
    let i=0;
    i<records.length;
    i++
  ) {

    records[i].sortOrder =
      i;


    await supabaseRequest(
      `${SUPABASE_TABLE}?id=eq.${encodeURIComponent(records[i].id)}`,
      {

        method:"PATCH",

        body:
          JSON.stringify({

            sort_order:i,

            updated_at:
              new Date().toISOString()

          })

      }
    );

  }

}


/* =========================================================
   GPS
========================================================= */

function dmsToDecimal(
  degrees,
  minutes,
  seconds,
  direction
) {

  let decimal =
    Math.abs(Number(degrees))
    +
    Number(minutes) / 60
    +
    Number(seconds) / 3600;


  if(
    direction === "S" ||
    direction === "W"
  ) {

    decimal =
      -decimal;

  }


  return decimal;

}


function parseGPS(gps) {

  if(!gps) {

    return null;

  }


  const value =
    String(gps)
      .trim()
      .replace(/，/g,",")
      .replace(/\s+/g," ");


  const decimalMatch =
    value.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*$/
    );


  if(decimalMatch) {

    const latitude =
      Number(
        decimalMatch[1]
      );


    const longitude =
      Number(
        decimalMatch[2]
      );


    if(
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {

      return {
        latitude,
        longitude
      };

    }

  }


  const dmsMatch =
    value.match(
      /^\s*(\d+(?:\.\d+)?)\s*°\s*(\d+(?:\.\d+)?)\s*['′]\s*(\d+(?:\.\d+)?)\s*(?:"|″)?\s*([NS])\s*,?\s*(\d+(?:\.\d+)?)\s*°\s*(\d+(?:\.\d+)?)\s*['′]\s*(\d+(?:\.\d+)?)\s*(?:"|″)?\s*([EW])\s*$/i
    );


  if(dmsMatch) {

    const latitude =
      dmsToDecimal(
        dmsMatch[1],
        dmsMatch[2],
        dmsMatch[3],
        dmsMatch[4].toUpperCase()
      );


    const longitude =
      dmsToDecimal(
        dmsMatch[5],
        dmsMatch[6],
        dmsMatch[7],
        dmsMatch[8].toUpperCase()
      );


    if(
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {

      return {
        latitude,
        longitude
      };

    }

  }


  return null;

}


/* =========================================================
   YANDEX MAP
========================================================= */

function createMapLink(gps) {

  if(!gps) {

    return "";

  }


  const coordinates =
    parseGPS(gps);


  if(!coordinates) {

    return `
      <span class="cell-muted">
        ${escapeHtml(gps)}
      </span>
    `;

  }


  const latitude =
    coordinates.latitude;


  const longitude =
    coordinates.longitude;


  const yandexUrl =
    `https://yandex.com/maps/?ll=${
      encodeURIComponent(
        `${longitude},${latitude}`
      )
    }&z=17&l=map&text=${
      encodeURIComponent(
        `${latitude},${longitude}`
      )
    }`;


  return `

    <a
      class="gps-link"
      href="${yandexUrl}"
      target="_blank"
      rel="noopener noreferrer"
      title="${
        currentLanguage === "az"
          ? "Yandex Maps-də göstər"
          : "Show in Yandex Maps"
      }"
    >
      📍 ${escapeHtml(gps)}
    </a>

  `;

}


/* =========================================================
   STATUS SUMMARY
========================================================= */

function updateStatusSummary() {

  const records =
    database[
      currentSystem
    ][
      currentRoute
    ] || [];


  const total =
    records.length;


  const inPlace =
    records.filter(
      record =>
        record.status ===
        "inPlace"
    ).length;


  const damaged =
    records.filter(
      record =>
        record.status ===
        "damaged"
    ).length;


  const missing =
    records.filter(
      record =>
        record.status ===
        "missing"
    ).length;


  document.getElementById(
    "totalStatusCount"
  ).textContent =
    total;


  document.getElementById(
    "inPlaceCount"
  ).textContent =
    inPlace;


  document.getElementById(
    "damagedCount"
  ).textContent =
    damaged;


  document.getElementById(
    "missingCount"
  ).textContent =
    missing;


  document.getElementById(
    "recordCount"
  ).textContent =
    total;

}


/* =========================================================
   PAGE
========================================================= */

function updatePage() {

  const system =
    systems[currentSystem];


  const route =
    routes[currentRoute];


  document.getElementById(
    "systemTitle"
  ).textContent =
    system[currentLanguage];


  document.getElementById(
    "systemDescription"
  ).textContent =

    currentLanguage === "az"

      ? system.descriptionAz

      : system.descriptionEn;


  document.getElementById(
    "breadcrumbRoute"
  ).textContent =
    route[currentLanguage];


  document.getElementById(
    "routeNumber"
  ).textContent =
    route.number;


  document.getElementById(
    "routeTitle"
  ).textContent =
    route[currentLanguage];


  updateStatusSummary();

  renderTable();

}


/* =========================================================
   STATUS TEXT
========================================================= */

function getStatusText(status) {

  return (

    statuses[status]?.[
      currentLanguage
    ]

    ||

    statuses.inPlace[
      currentLanguage
    ]

  );

}


/* =========================================================
   TABLE
========================================================= */

function renderTable() {

  const body =
    document.getElementById(
      "tableBody"
    );


  const container =
    document.getElementById(
      "tableContainer"
    );


  const empty =
    document.getElementById(
      "emptyState"
    );


  const searchInput =
    document.getElementById(
      "searchInput"
    );


  const search =
    searchInput.value
      .trim()
      .toLowerCase();


  const records =
    database[
      currentSystem
    ][
      currentRoute
    ] || [];


  const ordered =
    sortRecords(
      records
    );


  const filtered =
    ordered.filter(
      record => {

        if(!search) {

          return true;

        }


        const searchable = [

          record.masterCode,

          record.signType,

          record.region,

          record.gps,

          record.imageLink,

          record.note,

          statuses[
            record.status
          ]?.az,

          statuses[
            record.status
          ]?.en

        ]
          .join(" ")
          .toLowerCase();


        return searchable.includes(
          search
        );

      }
    );


  if(filtered.length === 0) {

    body.innerHTML =
      "";


    container.style.display =
      "none";


    empty.style.display =
      "block";


    const hasRecords =
      records.length > 0;


    document.getElementById(
      "emptyTitle"
    ).textContent =

      hasRecords

        ? (

            currentLanguage === "az"

              ? "Nəticə tapılmadı"

              : "No results found"

          )

        : (

            currentLanguage === "az"

              ? "Hələ məlumat əlavə edilməyib"

              : "No information added yet"

          );


    document.getElementById(
      "emptyDescription"
    ).textContent =

      hasRecords

        ? (

            currentLanguage === "az"

              ? "Axtarış sözünü dəyişin."

              : "Try a different search."

          )

        : (

            currentLanguage === "az"

              ? "Bu dəhliz üçün ilk turistik işarəni əlavə edin."

              : "Add the first tourist sign for this corridor."

          );


    return;

  }


  container.style.display =
    "block";


  empty.style.display =
    "none";


  body.innerHTML =
    filtered.map(
      record => {

        const index =
          ordered.findIndex(
            item =>
              String(item.id) ===
              String(record.id)
          );


        let statusClass =
          "status-in-place";


        if(
          record.status ===
          "damaged"
        ) {

          statusClass =
            "status-damaged";

        }


        if(
          record.status ===
          "missing"
        ) {

          statusClass =
            "status-missing";

        }


        return `

          <tr
            class="drag-row"
            draggable="${
              search
                ? "false"
                : "true"
            }"
            data-id="${escapeHtml(record.id)}"
          >

            <td class="serial-column">

              <span class="serial-number">

                ${
                  String(index + 1)
                    .padStart(2,"0")
                }

              </span>

            </td>


            <td>

              <span class="master-code">

                <span class="drag-handle">
                  ⋮⋮
                </span>

                ${
                  record.masterCode
                    ? escapeHtml(
                        record.masterCode
                      )
                    : "—"
                }

              </span>

            </td>


            <td>

              ${
                record.signType

                  ? escapeHtml(
                      record.signType
                    )

                  : '<span class="cell-muted">—</span>'
              }

            </td>


            <td>

              ${
                record.region

                  ? escapeHtml(
                      record.region
                    )

                  : '<span class="cell-muted">—</span>'
              }

            </td>


            <td>

              ${
                record.gps

                  ? createMapLink(
                      record.gps
                    )

                  : '<span class="cell-muted">—</span>'
              }

            </td>


            <td>

              ${
                record.imageLink

                  ? `

                    <a
                      class="image-link"
                      href="${escapeHtml(record.imageLink)}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ↗ Şəkil
                    </a>

                  `

                  : '<span class="cell-muted">—</span>'
              }

            </td>


            <td>

              <span
                class="status-badge ${statusClass}"
              >

                ${
                  escapeHtml(
                    getStatusText(
                      record.status
                    )
                  )
                }

              </span>

            </td>


            <td>

              ${
                record.note

                  ? `

                    <span
                      class="note-cell"
                      title="${escapeHtml(record.note)}"
                    >
                      ${escapeHtml(record.note)}
                    </span>

                  `

                  : '<span class="cell-muted">—</span>'
              }

            </td>


            <td>

              <div class="actions">

                <button
                  type="button"
                  class="action-btn edit"
                  data-action="edit"
                  data-id="${escapeHtml(record.id)}"
                  title="${
                    currentLanguage === "az"
                      ? "Redaktə et"
                      : "Edit"
                  }"
                >
                  ✎
                </button>


                <button
                  type="button"
                  class="action-btn delete"
                  data-action="delete"
                  data-id="${escapeHtml(record.id)}"
                  title="${
                    currentLanguage === "az"
                      ? "Sil"
                      : "Delete"
                  }"
                >
                  ×
                </button>

              </div>

            </td>

          </tr>

        `;

      }
    ).join("");


  setupDragAndDrop();

}


/* =========================================================
   TABLE ACTIONS
========================================================= */

function setupTableActions() {

  document.getElementById(
    "tableBody"
  ).addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          "[data-action]"
        );


      if(!button) {

        return;

      }


      const id =
        button.dataset.id;


      if(
        button.dataset.action ===
        "edit"
      ) {

        openModal(id);

        return;

      }


      if(
        button.dataset.action ===
        "delete"
      ) {

        const question =

          currentLanguage === "az"

            ? "Bu işarəni silmək istəyirsiniz?"

            : "Are you sure you want to delete this sign?";


        if(!confirm(question)) {

          return;

        }


        try {

          await deleteRecord(id);


          database[
            currentSystem
          ][
            currentRoute
          ] =
            database[
              currentSystem
            ][
              currentRoute
            ].filter(
              record =>
                String(record.id) !==
                String(id)
            );


          await saveOrder();


          updatePage();


          showToast(

            currentLanguage === "az"

              ? "İşarə silindi."

              : "Sign deleted."

          );


        } catch(error) {

          console.error(
            error
          );


          showToast(

            currentLanguage === "az"

              ? "İşarə silinmədi."

              : "Sign could not be deleted."

          );

        }

      }

    }
  );

}


/* =========================================================
   DRAG AND DROP
========================================================= */

function setupDragAndDrop() {

  document.querySelectorAll(
    ".drag-row"
  ).forEach(
    row => {

      row.addEventListener(
        "dragstart",
        event => {

          const search =
            document.getElementById(
              "searchInput"
            ).value.trim();


          if(search) {

            event.preventDefault();


            showToast(

              currentLanguage === "az"

                ? "Sıralamaq üçün axtarışı təmizləyin."

                : "Clear the search before reordering."

            );


            return;

          }


          draggedId =
            row.dataset.id;


          row.classList.add(
            "dragging"
          );


          event.dataTransfer.effectAllowed =
            "move";

        }
      );


      row.addEventListener(
        "dragend",
        () => {

          row.classList.remove(
            "dragging"
          );


          draggedId =
            null;

        }
      );


      row.addEventListener(
        "dragover",
        event => {

          event.preventDefault();


          const dragging =
            document.querySelector(
              ".dragging"
            );


          if(
            !dragging ||
            dragging === row
          ) {

            return;

          }


          const rect =
            row.getBoundingClientRect();


          const middle =
            rect.top +
            rect.height / 2;


          if(
            event.clientY <
            middle
          ) {

            row.parentNode.insertBefore(
              dragging,
              row
            );

          } else {

            row.parentNode.insertBefore(
              dragging,
              row.nextSibling
            );

          }

        }
      );


      row.addEventListener(
        "drop",
        async event => {

          event.preventDefault();


          await saveDomOrder();

        }
      );

    }
  );

}


/* =========================================================
   SAVE DOM ORDER
========================================================= */

async function saveDomOrder() {

  const rows = [

    ...document.querySelectorAll(
      "#tableBody .drag-row"
    )

  ];


  const records =
    database[
      currentSystem
    ][
      currentRoute
    ];


  const recordMap =
    new Map(

      records.map(
        record => [

          String(record.id),

          record

        ]
      )

    );


  const reordered =
    rows
      .map(
        row =>
          recordMap.get(
            String(
              row.dataset.id
            )
          )
      )
      .filter(Boolean);


  if(
    reordered.length !==
    records.length
  ) {

    return;

  }


  database[
    currentSystem
  ][
    currentRoute
  ] =
    reordered;


  try {

    await saveOrder();


    updatePage();


    showToast(

      currentLanguage === "az"

        ? "Sıralama yeniləndi."

        : "Order updated."

    );


  } catch(error) {

    console.error(
      error
    );


    showToast(

      currentLanguage === "az"

        ? "Sıralama yadda saxlanmadı."

        : "Order could not be saved."

    );

  }

}


/* =========================================================
   MODAL OPEN
========================================================= */

function openModal(id=null) {

  editingId =
    id;


  document.getElementById(
    "signForm"
  ).reset();


  document.getElementById(
    "status"
  ).value =
    "inPlace";


  if(id !== null) {

    const record =
      database[
        currentSystem
      ][
        currentRoute
      ].find(
        item =>
          String(item.id) ===
          String(id)
      );


    if(!record) {

      return;

    }


    document.getElementById(
      "masterCode"
    ).value =
      record.masterCode;


    document.getElementById(
      "signType"
    ).value =
      record.signType;


    document.getElementById(
      "region"
    ).value =
      record.region;


    document.getElementById(
      "gps"
    ).value =
      record.gps;


    document.getElementById(
      "imageLink"
    ).value =
      record.imageLink;


    document.getElementById(
      "status"
    ).value =
      record.status;


    document.getElementById(
      "note"
    ).value =
      record.note;

  }


  updateModalText();


  document.getElementById(
    "signModal"
  ).classList.add(
    "open"
  );


  document.body.style.overflow =
    "hidden";


  setTimeout(
    () => {

      document.getElementById(
        "masterCode"
      ).focus();

    },
    80
  );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

  document.getElementById(
    "signModal"
  ).classList.remove(
    "open"
  );


  document.body.style.overflow =
    "";


  editingId =
    null;


  document.getElementById(
    "signForm"
  ).reset();


  document.getElementById(
    "status"
  ).value =
    "inPlace";

}


/* =========================================================
   MODAL TEXT
========================================================= */

function updateModalText() {

  document.getElementById(
    "modalTitle"
  ).textContent =

    editingId !== null

      ? (

          currentLanguage === "az"

            ? "İşarəni redaktə et"

            : "Edit sign"

        )

      : (

          currentLanguage === "az"

            ? "Yeni işarə"

            : "New sign"

        );


  document.querySelectorAll(
    "#status option"
  ).forEach(
    option => {

      option.textContent =
        option.dataset[
          currentLanguage
        ];

    }
  );


  document.querySelectorAll(
    "[data-az-placeholder][data-en-placeholder]"
  ).forEach(
    element => {

      element.placeholder =

        currentLanguage === "az"

          ? element.dataset.azPlaceholder

          : element.dataset.enPlaceholder;

    }
  );

}


/* =========================================================
   FORM
========================================================= */

function setupForm() {

  document.getElementById(
    "signForm"
  ).addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const saveButton =
        document.getElementById(
          "saveBtn"
        );


      const record = {

        masterCode:
          document.getElementById(
            "masterCode"
          ).value.trim(),

        signType:
          document.getElementById(
            "signType"
          ).value.trim(),

        region:
          document.getElementById(
            "region"
          ).value.trim(),

        gps:
          document.getElementById(
            "gps"
          ).value.trim(),

        imageLink:
          document.getElementById(
            "imageLink"
          ).value.trim(),

        status:
          document.getElementById(
            "status"
          ).value,

        note:
          document.getElementById(
            "note"
          ).value.trim()

      };


      saveButton.disabled =
        true;


      saveButton.textContent =

        currentLanguage === "az"

          ? "Saxlanılır..."

          : "Saving...";


      try {

        if(editingId !== null) {

          await updateRecord(
            editingId,
            record
          );


          const records =
            database[
              currentSystem
            ][
              currentRoute
            ];


          const index =
            records.findIndex(
              item =>
                String(item.id) ===
                String(editingId)
            );


          if(index !== -1) {

            records[index] = {

              ...records[index],

              ...record

            };

          }


          closeModal();


          updatePage();


          showToast(

            currentLanguage === "az"

              ? "İşarə yeniləndi."

              : "Sign updated."

          );


        } else {

          const created =
            await insertRecord(
              record
            );


          database[
            currentSystem
          ][
            currentRoute
          ].push(
            created
          );


          closeModal();


          updatePage();


          showToast(

            currentLanguage === "az"

              ? "Yeni işarə əlavə edildi."

              : "New sign added."

          );

        }


      } catch(error) {

        console.error(
          "SAVE ERROR:",
          error
        );


        showToast(

          currentLanguage === "az"

            ? "Məlumat yadda saxlanmadı."

            : "Information could not be saved."

        );

      }


      finally {

        saveButton.disabled =
          false;


        updateModalText();

      }

    }
  );

}


/* =========================================================
   SYSTEM BUTTONS
========================================================= */

function setupSystemButtons() {

  document.querySelectorAll(
    ".system-btn"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          currentSystem =
            button.dataset.system;


          /*
            Sistem dəyişəndə
            avtomatik 01-ci dəhlizə keçir.
          */

          currentRoute =
            "bakuAbsheron";


          document.querySelectorAll(
            ".system-btn"
          ).forEach(
            item => {

              item.classList.toggle(
                "active",
                item === button
              );

            }
          );


          document.querySelectorAll(
            ".route-btn"
          ).forEach(
            item => {

              item.classList.toggle(
                "active",
                item.dataset.route ===
                "bakuAbsheron"
              );

            }
          );


          document.getElementById(
            "searchInput"
          ).value =
            "";


          updatePage();

        }
      );

    }
  );

}


/* =========================================================
   ROUTE BUTTONS
========================================================= */

function setupRouteButtons() {

  document.querySelectorAll(
    ".route-btn"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const route =
            button.dataset.route;


          if(!routes[route]) {

            return;

          }


          currentRoute =
            route;


          document.querySelectorAll(
            ".route-btn"
          ).forEach(
            item => {

              item.classList.toggle(
                "active",
                item === button
              );

            }
          );


          document.getElementById(
            "searchInput"
          ).value =
            "";


          updatePage();

        }
      );

    }
  );

}


/* =========================================================
   RESET BUTTONS
========================================================= */

function setupResetButtons() {

  document.querySelectorAll(
    ".route-reset-btn"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        async event => {

          event.stopPropagation();


          const routeId =
            button.dataset.resetRoute;


          const route =
            routes[routeId];


          const question =

            currentLanguage === "az"

              ? `"${route.az}" üzrə bütün məlumatlar silinsin?`

              : `Delete all data from "${route.en}"?`;


          if(!confirm(question)) {

            return;

          }


          try {

            await supabaseRequest(

              `${SUPABASE_TABLE}?system_id=eq.${encodeURIComponent(currentSystem)}&corridor_id=eq.${encodeURIComponent(routeId)}`,

              {
                method:"DELETE"
              }

            );


            database[
              currentSystem
            ][
              routeId
            ] = [];


            updatePage();


            showToast(

              currentLanguage === "az"

                ? "Dəhliz sıfırlandı."

                : "Corridor reset."

            );


          } catch(error) {

            console.error(
              error
            );


            showToast(

              currentLanguage === "az"

                ? "Dəhliz sıfırlanmadı."

                : "Corridor reset failed."

            );

          }

        }
      );

    }
  );

}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

  document.getElementById(
    "searchInput"
  ).addEventListener(
    "input",
    renderTable
  );

}


/* =========================================================
   LANGUAGE
========================================================= */

function applyLanguage(
  language
) {

  currentLanguage =
    language;


  document.documentElement.lang =
    language;


  document.querySelectorAll(
    "[data-az][data-en]"
  ).forEach(
    element => {

      element.textContent =
        element.dataset[
          language
        ];

    }
  );


  document.querySelectorAll(
    ".lang-btn"
  ).forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.language ===
        language
      );

    }
  );


  updateModalText();

  updateThemeIcon();

  updatePage();

}


function setupLanguage() {

  document.querySelectorAll(
    ".lang-btn"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          applyLanguage(
            button.dataset.language
          );

        }
      );

    }
  );

}


/* =========================================================
   THEME
========================================================= */

function updateThemeIcon() {

  const icon =
    document.getElementById(
      "themeIcon"
    );


  if(!icon) {

    return;

  }


  const dark =
    document.body.classList.contains(
      "dark"
    );


  icon.textContent =
    dark
      ? "☾"
      : "☀";


  const button =
    document.getElementById(
      "themeToggle"
    );


  if(button) {

    button.title =

      currentLanguage === "az"

        ? (

            dark

              ? "Gündüz rejiminə keç"

              : "Gecə rejiminə keç"

          )

        : (

            dark

              ? "Switch to light mode"

              : "Switch to dark mode"

          );

  }

}


function setupTheme() {

  const saved =
    localStorage.getItem(
      "tourSignTheme"
    );


  document.body.classList.toggle(
    "dark",
    saved === "dark"
  );


  updateThemeIcon();


  document.getElementById(
    "themeToggle"
  ).addEventListener(
    "click",
    () => {

      const dark =
        document.body.classList.contains(
          "dark"
        );


      document.body.classList.toggle(
        "dark",
        !dark
      );


      localStorage.setItem(

        "tourSignTheme",

        !dark
          ? "dark"
          : "light"

      );


      updateThemeIcon();

    }
  );

}


/* =========================================================
   MODAL
========================================================= */

function setupModal() {

  document.getElementById(
    "newSignBtn"
  ).addEventListener(
    "click",
    () => openModal()
  );


  document.getElementById(
    "emptyAddBtn"
  ).addEventListener(
    "click",
    () => openModal()
  );


  document.getElementById(
    "modalClose"
  ).addEventListener(
    "click",
    closeModal
  );


  document.getElementById(
    "cancelBtn"
  ).addEventListener(
    "click",
    closeModal
  );


  document.getElementById(
    "modalOverlay"
  ).addEventListener(
    "click",
    closeModal
  );


  document.addEventListener(
    "keydown",
    event => {

      if(
        event.key ===
        "Escape"
      ) {

        const modal =
          document.getElementById(
            "signModal"
          );


        if(
          modal.classList.contains(
            "open"
          )
        ) {

          closeModal();

        }

      }

    }
  );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );


  document.getElementById(
    "toastText"
  ).textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2800
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

async function initialize() {

  setupSystemButtons();

  setupRouteButtons();

  setupResetButtons();

  setupTableActions();

  setupForm();

  setupModal();

  setupLanguage();

  setupTheme();

  setupSearch();


  applyLanguage(
    "az"
  );


  try {

    await loadDatabase();


    updatePage();

  } catch(error) {

    console.error(
      "SUPABASE ERROR:",
      error
    );


    database =
      createDatabase();


    updatePage();


    showToast(

      currentLanguage === "az"

        ? "Baza ilə əlaqə qurulmadı. Publishable key və Supabase cədvəlini yoxlayın."

        : "Database connection failed. Check the publishable key and Supabase table."

    );

  }

}


/* =========================================================
   START
========================================================= */

if(
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );

} else {

  initialize();

}