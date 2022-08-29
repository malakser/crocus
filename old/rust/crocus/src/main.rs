use std::fs;
use std::any::type_name;
use adblock::engine::Engine;
use adblock::lists::{FilterSet, ParseOptions};

/*
fn main() {
    let rules = vec![
        String::from("-advertisement-icon."),
        String::from("-advertisement-management/"),
        String::from("-advertisement."),
        String::from("-advertisement/script."),
    ];

    let mut filter_set = FilterSet::new(true);
    filter_set.add_filters(&rules, ParseOptions::default());

    let blocker = Engine::from_filter_set(filter_set, true);
    let blocker_result = blocker.check_network_urls("http://example.com/-advertisement-icon.", "http://example.com/helloworld", "image");

    println!("Blocker result: {:?}", blocker_result);
}
*/
fn print_type_of<T>(_: &T) {
    println!("{}", std::any::type_name::<T>())
}

fn main() {
  let text :String = fs::read_to_string("easylist.txt")
    .expect("aaa");
  let rules :Vec<String> = text.split("\n").map(|x| String::from(x)).collect();
	println!("rules loaded");
  let mut filter_set = FilterSet::new(true);
  filter_set.add_filters(&rules, ParseOptions::default());
  let blocker = Engine::from_filter_set(filter_set, true);
	println!("filters loaded");
  let blocker_result = blocker.check_network_urls("https://www.onet.pl", "https://www.onet.pl", "document");

  println!("Blocker result: {:?}", blocker_result);
}
