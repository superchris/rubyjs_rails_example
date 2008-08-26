require 'dom_element'
require 'json'
require 'rwt/HTTPRequest'

class Customer
  
  
  attr_accessor :attributes
  
  def initialize(attrs)
    @attributes = attrs
  end
  
  def method_missing(method, *args)
    if method =~ /(.*)=$/
      attributes[$1] = args[0]
    elsif attributes[method]
      attributes[method]
    else
      super
    end
  end
  
  def self.main
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
  
  def self.find(id)
    HTTPRequest.asyncGet "/customers/#{id}.json" do |json|
      hash = JSON.load(json)
      yield Customer.new(hash["customer"])
    end    
  end
  
  def save
    request_json = {:customer => attributes}.to_json
    HTTPRequest.asyncImpl "/customers/#{id}.json", "PUT", request_json, "application/json" do |json|
      self.attributes = JSON.load(json)
    end
  end
  
  def to_json
    attributes.to_json
  end
end
