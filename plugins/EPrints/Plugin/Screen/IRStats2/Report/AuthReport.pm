package EPrints::Plugin::Screen::IRStats2::Report::AuthReport;

use EPrints::Plugin::Screen::IRStats2::Report;
@ISA = ( 'EPrints::Plugin::Screen::IRStats2::Report' );

use strict;
use EPrints::Plugin::Stats::Utils;

sub can_be_viewed
{
	my( $self ) = @_;

	my $session = $self->{session};

    return 0 if( !defined $session->current_user );

	if( defined $session && $session->can_call( 'irstats2', 'allow' ) )
	{       
		return $session->call( ['irstats2', 'allow'], $session, 'irstats2/view' );
	} 

	return 0;
}

sub from
{
	my( $self ) = @_;

	$self->SUPER::from;

	my $processor = $self->{processor};
	$processor->{stats}->{handler} = $self->{session}->plugin( 'Stats::Handler' );

	$processor->{context} = $processor->{stats}->{handler}->context()->from_request;

	my $report = $processor->{context}->current_report;
	my $conf = $self->{session}->config( 'irstats2', 'auth_report', $report );
	$processor->{stats}->{conf} = EPrints::Utils::clone( $conf );
}

1;
