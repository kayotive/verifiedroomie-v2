update public.profiles
set looking_state = null, looking_area = null
where looking_state in (
  'Abia','Adamawa','Akwa Ibom','Anambra','Bayelsa','Benue','Borno','Cross River',
  'Delta','Ebonyi','Edo','Ekiti','Imo','Jigawa','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Taraba','Yobe','Zamfara'
);