package EPrints::Plugin::Stats::Filter::BadAccessData;

use EPrints::Plugin::Stats::Processor;

our @ISA = qw/ EPrints::Plugin::Stats::Processor /;

use strict;

# Stats::Filter::BadAccessData
#
# Filters out rows which failed to savein the database. These will have only an accessid, but no other data.
#

sub new
{
        my( $class, %params ) = @_;
	my $self = $class->SUPER::new( %params );

        $self->{provides} = [];

        $self->{disable} = 0;
	$self->{priority} = 100;

	return $self;
}

sub create_tables 
{
        my( $self, $handler ) = @_;
}

sub clear_cache
{
        my( $self ) = @_;
}

sub commit_data
{
        my( $self, $handler ) = @_;
}

# if datstamp isn't set, it's a bad row!
sub filter_record
{
	my ($self, $record) = @_;

	return 1 unless defined $record->{datestamp};

	return 0;

}

1;
