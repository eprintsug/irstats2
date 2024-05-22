package EPrints::Plugin::Stats::View::Cached;

our @ISA = qw/ EPrints::Plugin::Stats::View /;

use strict;

# Stats::View::Cached
#
# Displays a cached result
# 
# Options:
# - human_display: formats the number for humans (e.g. 1000 -> 1,000)

sub javascript_class
{
    return 'Cached';
}

sub render_content_ajax
{
    my( $self ) = @_;

    my $count = $self->handler->data( $self->context )->select()->data();

    my $span = $self->{session}->make_element( 'span', class => 'irstats2_counter_value' );
    $span->appendChild( $self->{session}->make_text( $count ) );
    return $span;
}

1;

