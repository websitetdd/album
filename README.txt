Put your photo and video files in here.

A subfolder per album keeps things tidy, e.g.:

  media/
    kep-weekend/
      sunset.jpg
      boat.mp4
    birthday/
      cake.jpg
      party.mov

Then list them under the matching album in albums.js, e.g.:

  const ALBUMS = [
    {
      title: "Kep Weekend",
      items: [
        "media/kep-weekend/sunset.jpg",
        "media/kep-weekend/boat.mp4",
      ],
    },
    {
      title: "Birthday",
      items: [
        "media/birthday/cake.jpg",
        "media/birthday/party.mov",
      ],
    },
  ];

Delete the /example folder and the example album entry in
albums.js once you've added your own.
