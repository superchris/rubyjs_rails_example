require 'dom_element'
require 'json'
require 'rwt/HTTPRequest'
require 'foo'
require 'bar'

require 'active_resource'

class Customer < ActiveResource
  
  def self.main
    #Foo.bark
    #Bar.bar
    @name = DOMElement.find("name")
    @address = DOMElement.find("address")
    find_button = DOMElement.find("choose_customer_button")
    save_button = DOMElement.find("save_button")
    customer_id_text = DOMElement.find("customer_id")
    
    find_button.observe("click") do |event|
      Customer.find(customer_id_text["value"]) do |customer|
        @name["value"] = customer.name
        @address["value"] = customer.address
        @customer = customer
      end
    end
    
    save_button.observe("click") do |event|
      @customer.name = @name["value"]
      @customer.address = @address["value"]
      @customer.save
    end
    
    rescue StandardError => ex
      puts ex
  end
  
end
