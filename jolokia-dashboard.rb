#!/usr/bin/env ruby

require 'rubygems' unless defined? ::Gem
require 'net/http'
require 'uri'
require 'json'
require 'sinatra/base'
require 'sinatra/json'

class JolokiaDashboard < Sinatra::Base

  set :config, eval(IO.read(ENV['JOLOKIA_CONFIG'] || 'config.rb'))

  configure :development do
    enable :logging, :dump_errors, :raise_errors, :show_exceptions
  end

  get '/' do
    @title = settings.config[:title]
    erb :index
  end

  get '/api/servers' do
    json get_servers
  end

  get '/api/read/:artifact/:phase/:host/:klass/:type' do |artifact, phase, host, klass, type|
    json get_jolokia(artifact, phase, host).read(klass, type)
  end

  post '/api/exec/:artifact/:phase/:host/:klass/:type' do |artifact, phase, host, klass, type|
    params = JSON.parse request.body.read
    p params
    ret = get_jolokia(artifact, phase, host).exec(klass, type, params['opName'], params['args'])
    p ret
    json ret
  end

  get '/api/list/:artifact/:phase/:host' do |artifact, phase, host|
    json get_jolokia(artifact, phase, host).list()
  end

  def get_servers
    settings.config[:servers]
  end

  def get_jolokia(artifact, phase, host)
    servers = get_servers[artifact][phase]
    info = servers.select {|it| it[:host] == host }[0]
    Jolokia.new("http://#{host}:#{info[:jolokia_port]}/jolokia")
  end

  class Jolokia
    def initialize(base)
      @base = base
    end

    def read(klass, type)
      uri = URI(@base+"/read/#{URI.escape(klass)}:#{URI.escape(type)}")
      content = Net::HTTP.get(uri)
      return JSON.parse(content)['value']
    end

    def exec(klass, type, opName, args)
      uri = URI(@base+"/exec/#{URI.escape(klass)}:#{URI.escape(type)}/#{URI.escape(opName)}/#{args.map {|s| URI.escape(s) }.join("/") }")
      puts uri
      content = Net::HTTP.get(uri)
      return JSON.parse(content)
    end

    def list
      uri = URI(@base+"/list/")
      content = Net::HTTP.get(uri)
      return JSON.parse(content)
    end
  end

end

require 'optparse'

options = {}
OptionParser.new { |o|
    o.on('-p port', 'Set port number (default = 4567)') { |port| options[:port] = port.to_i }
      o.on('-o address', 'Set address to bind (default = 0.0.0.0)') { |addr| options[:bind] = addr }
}.parse!(ARGV.dup)

JolokiaDashboard.run!(options)
